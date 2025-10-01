import * as express from 'express';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import { runPythonCopyPdfInLoop, runPthonPdfExtractionInLoop, executePythonPostCall, MergePdfsResponseData } from '../services/pythonRestService';
import { IMG_TYPE_ANY } from '../mirror/constants';
import { PythonExtractionResult } from 'services/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as mongoose from 'mongoose';
import { MergeMultiplePdfTracker } from '../models/mergeMultiplePdfTracker';
import { randomUUID } from 'crypto';

export const pythonRoute = express.Router();

export interface MergePdfsBody {
    [key: string]: unknown;
    first_pdf_path: string;
    second_pdf_path: string;
    third_pdf_path?: string;
}
pythonRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        let destRootFolderAsCSV = req?.body?.destRootFolder;
        const reducePdfSizeAlso = req?.body?.reducePdfSizeAlso || true;
        const nPages = req?.body?.nPages || DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let firstNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let lastNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;

        if (!isNaN(nPages)) {
            firstNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
            lastNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
        } else {
            if (nPages?.trim().includes('-')) {
                const [start, end] = nPages.split('-').map((x: string) => parseInt(x?.trim()));
                firstNPages = start;
                lastNPages = end;
            } else {
                firstNPages = parseInt(nPages?.trim());
                lastNPages = parseInt(nPages?.trim());
            }
        }
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x: string) => x.trim());
        const _destRootFolders: string[] = destRootFolderAsCSV.split(',').map((x: string) => x.trim());

        if (_srcFolders.length !== _destRootFolders.length) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Src Folder and Dest Folder Count Mismatch"
                }
            });
            return;
        }

        console.log(`getFirstAndLastNPages _folders(${_srcFolders.length}) ${_srcFolders} 
        ${_destRootFolders.length}  ${destRootFolderAsCSV}
        ${firstNPages}/${lastNPages}`)

        if (!srcFoldersAsCSV || !destRootFolderAsCSV) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        const combinedResults: PythonExtractionResult[] = await runPthonPdfExtractionInLoop(_srcFolders,
            _destRootFolders, firstNPages, lastNPages, reducePdfSizeAlso);

        if (combinedResults) {
            const stats = combinedResults.filter((extractResult: PythonExtractionResult) => extractResult.success === true).length;
            console.log(`combinedResults extractFirstN: ${stats} of ${combinedResults.length} processed successfully`);
            resp.status(200).send({
                response: {
                    successes: stats === combinedResults.length,
                    _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                    combinedResults,
                }
            });
        }
        else {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Failed to extract PDFs"
                }
            });
        }
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


// List all unique commonRunIds with the oldest createdAt per commonRunId
pythonRoute.get('/merge-multiple-pdf-tracker/common-runs', async (_req: any, resp: any) => {
    try {
        const results = await MergeMultiplePdfTracker.aggregate([
            {
                $group: {
                    _id: '$commonRunId',
                    oldestCreatedAt: { $min: '$createdAt' },
                    anyCount: { $first: '$pdfPathsToMergeCount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    commonRunId: '$_id',
                    createdAt: '$oldestCreatedAt',
                    pdfPathsToMergeCount: '$anyCount',
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        resp.status(200).send({ response: results });
    } catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
});

// Return all tracker entries for a given commonRunId
pythonRoute.get('/merge-multiple-pdf-tracker/by-common-run/:commonRunId', async (req: any, resp: any) => {
    try {
        const { commonRunId } = req.params;
        if (!commonRunId || !mongoose.Types.ObjectId.isValid(commonRunId)) {
            resp.status(400).send({
                response: {
                    status: 'failed',
                    success: false,
                    msg: 'Invalid or missing commonRunId',
                },
            });
            return;
        }
        const _id = new mongoose.Types.ObjectId(commonRunId);
        const docs = await MergeMultiplePdfTracker.find({ commonRunId: _id }).sort({ createdAt: 1 }).lean();
        resp.status(200).send({ response: docs });
    } catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
});

pythonRoute.post('/copyAllPdfs', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        let destRootFolder = req?.body?.destRootFolder;
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x: string) => x.trim());
        console.log(`copyAllPdfs _folders(${_srcFolders.length}) ${_srcFolders} 
        destRootFolder ${destRootFolder}`);

        if (!srcFoldersAsCSV || !destRootFolder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        const combinedResults = await runPythonCopyPdfInLoop(_srcFolders, destRootFolder);
        const stats = combinedResults.filter((x: { success: boolean }) => x.success === true).length;
        console.log(`combinedResults copyAllPdfs: ${stats} of ${combinedResults.length} processed successfully`);
        resp.status(200).send({
            response: {
                successes: stats === combinedResults.length,
                _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                ...combinedResults,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

pythonRoute.post('/convert-img-folder-to-pdf', async (req: any, resp: any) => {
    try {
        const src_folder = req?.body?.src_folder;
        const dest_folder = req?.body?.dest_folder;
        const img_type = req?.body?.img_type;

        if (!src_folder || !dest_folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        console.log(`convert-img-folder-to-pdf src_folder ${src_folder} dest_folder ${dest_folder} img_type ${img_type}`);
        const _resp = await executePythonPostCall({
            "src_folder": src_folder,
            "dest_folder": dest_folder,
            img_type: img_type
        }, 'convert-img-folder-to-pdf');

        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

pythonRoute.post('/verfiyImgtoPdf', async (req: any, resp: any) => {
    try {
        const src_folder = req?.body?.src_folder;
        const img_type = req?.body?.img_type || IMG_TYPE_ANY;
        const dest_folder = req?.body?.dest_folder;

        if (!src_folder || !dest_folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src/Dest for Pdf->Img Verfication"
                }
            });
            return;
        }
        console.log(`verfiyImgtoPdf folder_path ${src_folder} img_type ${img_type}`);
        const _resp = await executePythonPostCall({
            "src_folder": src_folder,
            "dest_folder": dest_folder,
            "img_type": img_type
        }, 'verfiyImgtoPdf');

        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


pythonRoute.post('/mergePdfs', async (req: any, resp: any) => {
    try {
        const first_pdf_path = req?.body?.first_pdf_path;
        const second_pdf_path = req?.body?.second_pdf_path
        const third_pdf_path = req?.body?.third_pdf_path || ""

        if (!first_pdf_path || !second_pdf_path) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Complete Path for both Pdfs for merge"
                }
            });
            return;
        }
        console.log(`mergePdfs first_pdf_path ${first_pdf_path} second_pdf_path ${second_pdf_path}`);
        const _resp = await executePythonPostCall({
            "first_pdf_path": first_pdf_path,
            "second_pdf_path": second_pdf_path,
            "third_pdf_path": third_pdf_path
        }, 'mergePdfs');

        resp.status(200).send({
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})



// Move a file into destFolder/_dontOldMergedPdfs, preserving its path relative to destFolder when possible
async function moveOriginalIntoDontOldSubfolder(filePath: string, destFolder: string): Promise<string> {
    try {
        const subRoot = path.join(destFolder, '_dontOldMergedPdfs');

        // If file is already inside the _dontOldMergedPdfs folder, skip
        const normalized = path.normalize(filePath);
        if (normalized.startsWith(path.normalize(subRoot + path.sep))) {
            return normalized;
        }

        // Compute path relative to destFolder if inside; else fall back to basename
        let rel = path.relative(destFolder, normalized);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            rel = path.basename(normalized);
        }

        const targetPath = path.join(subRoot, rel);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        try {
            await fs.rename(normalized, targetPath);
        } catch (err) {
            // Fallback to copy+unlink across devices or if file is in use
            await fs.copyFile(normalized, targetPath);
            await fs.unlink(normalized);
        }
        return targetPath;
    } catch (e) {
        console.warn(`Failed to move original PDF '${filePath}' to _dontOldMergedPdfs:`, e);
        return filePath;
    }
}

pythonRoute.post('/mergeMutliplePdfs', async (req: any, resp: any) => {
    try {

        const destFolder = req?.body?.destFolder;
        const pdfPaths = req?.body?.pdfPaths;

        if (!destFolder || !pdfPaths) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide PdfPaths and Dest Folder for merge"
                }
            });
            return;
        }
        const allResponses = []
        const commonRunId = new mongoose.Types.ObjectId();
        const pdfPathsToMergeCount = pdfPaths.length;
        let pdfPathsProcessedCount = 0;
        for (let pdfPath of pdfPaths) {
            const pdfPathAsArray = pdfPath.split(",");
            if (pdfPathAsArray.length < 2) {
                console.log(`Skipping ${pdfPath}`)
                continue;
            }
            const first_pdf_path = pdfPathAsArray[0];
            const second_pdf_path = pdfPathAsArray[1];

            const pdfPathsAsBody: MergePdfsBody = {
                "first_pdf_path": first_pdf_path,
                "second_pdf_path": second_pdf_path,
            }
            let third_pdf_path = "";
            if (pdfPathAsArray.length > 2) {
                third_pdf_path = pdfPathAsArray[2];
                pdfPathsAsBody.third_pdf_path = third_pdf_path;
            }
            console.log(`Merging ${first_pdf_path} and ${second_pdf_path} ${third_pdf_path.length > 0 ? `and ${third_pdf_path}` : ""} `)
            const _resp = await executePythonPostCall<MergePdfsResponseData>(pdfPathsAsBody, 'mergePdfs');
            const runId = new mongoose.Types.ObjectId();
            console.log(`Merged ${first_pdf_path} and ${second_pdf_path} ${third_pdf_path.length > 0 ? `and ${third_pdf_path}` : ""} `)
            // Move results array to record where originals were moved
            const moveResults: Array<{ sourcePath: string; movedToPath: string }> = [];
            if (_resp?.status) {
                // Move the original PDFs into _dontOldMergedPdfs while preserving structure relative to destFolder
                for (const p of pdfPathAsArray) {
                    if (typeof p === 'string' && p.length > 0) {
                        const movedToPath = await moveOriginalIntoDontOldSubfolder(p, destFolder);
                        moveResults.push({ sourcePath: p, movedToPath });
                        console.log(`Merged ${p} moved to ${movedToPath}`)
                    }
                }
            }

            // Normalize operation result to expected shape
            const respAny = _resp as any;
            const operationResult = {
                status: Boolean(respAny?.status ?? respAny?.success),
                message: String(respAny?.message ?? respAny?.msg ?? ''),
                data: respAny?.data as MergePdfsResponseData | undefined,
            } as {
                status: boolean;
                message: string;
                data?: MergePdfsResponseData;
            };

            console.log(`operationResult ${JSON.stringify(operationResult)}`)
            console.log(`merged_pdf_path ${operationResult.data?.details?.merged_pdf?.path}`)
            console.log(`moveResults ${JSON.stringify(moveResults)}`)
            pdfPathsProcessedCount++;
            // Persist tracker document for this merge
            try {
                await MergeMultiplePdfTracker.create({
                    commonRunId,
                    pdfPathsToMergeCount,
                    runId,
                    first_pdf_path,
                    second_pdf_path,
                    ...(third_pdf_path ? { third_pdf_path } : {}),
                    operationResult,
                    moveResults,
                });
            } catch (e) {
                console.warn('Failed to persist MERGE_MULTIPLE_PDF_TRACKER doc', e);
            }

            allResponses.push(_resp)
        }

        console.log(`Merged ${pdfPathsProcessedCount} of ${pdfPathsToMergeCount} runs of pdf-merge-operations`)
        resp.status(200).send({
            status: `Merged ${pdfPathsProcessedCount} of ${pdfPathsToMergeCount} runs of pdf-merge-operations.`,
            response: allResponses
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
