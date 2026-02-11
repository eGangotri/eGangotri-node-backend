import * as express from 'express';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import { runPythonCopyPdfInLoop, runPthonPdfExtractionInLoop, executePythonPostCall, MergePdfsResponseData, PythonPostCallResult } from '../services/pythonRestService';
import { IMG_TYPE_ANY } from '../mirror/constants';
import { PythonExtractionResult } from 'services/types';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { anyPdfCorruptedQuick } from '../services/pdfValidationService';
import { saveMergeMultiplePdfTracker, getCommonRuns, getByCommonRun } from '../services/mergeMultiplePdfTrackerService';
import { ConvertData } from './types';

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

        const resultsAtAGlance = combinedResults.reduce((acc, curr: any) => {
            const data = curr?.data;
            const success = curr?.success;
            if (data) {
                acc.totals += (data.totalFiles || 0);
                acc.processed += (data.processedFiles || 0);
                acc.errors += (data.errors || 0);
            }
            acc.success += (success || false);
            return acc;
        }, { totals: 0, processed: 0, errors: 0, success: false });

        if (combinedResults && combinedResults.length > 0) {
            const stats = combinedResults.filter((extractResult: PythonExtractionResult) => extractResult.success === true).length;
            console.log(`combinedResults extractFirstN: ${stats} of ${combinedResults.length} processed successfully`);
            resp.status(200).send({
                response: {
                    resultsAtAGlance,
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
        const results = await getCommonRuns();
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
        if (!commonRunId) {
            resp.status(400).send({
                response: {
                    status: 'failed',
                    success: false,
                    msg: 'Invalid or missing commonRunId',
                },
            });
            return;
        }
        const docs = await getByCommonRun(commonRunId);
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

        const resultsAtAGlance = combinedResults.reduce((acc, curr: any) => {
            const data = curr?.data;
            const success = curr?.success;
            if (data) {
                acc.totals += (data.totalFiles || 0);
                acc.processed += (data.processedFiles || 0);
                acc.errors += (data.errors || 0);
            }
            acc.success += (success || false);
            return acc;
        }, { totals: 0, processed: 0, errors: 0, success: false });

        const stats = combinedResults.filter((x: { success: boolean }) => x.success === true).length;
        console.log(`combinedResults copyAllPdfs: ${stats} of ${combinedResults.length} processed successfully`);
        resp.status(200).send({
            response: {
                resultsAtAGlance,
                successes: stats === combinedResults.length,
                _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                combinedResults,
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

        const srcFolders = src_folder.includes(",") ? src_folder.split(",").map((link: string) => link.trim()) : [src_folder.trim()];
        const destRootFolders = dest_folder.includes(",") ? dest_folder.split(",").map((link: string) => link.trim()) : [dest_folder.trim()];
        if (!srcFolders || !dest_folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }

        if (srcFolders.length !== destRootFolders.length && destRootFolders.length !== 1) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Src Folder and Dest Folder Count Mismatch"
                }
            });
            return;
        }
        console.log(`convert-img-folder-to-pdf  ${srcFolders.length} src_folders for img_type ${img_type}`);
        const result: PythonPostCallResult<ConvertData>[] = []
        const commonRunId = randomUUID();
        for (let i = 0; i < srcFolders.length; i++) {
            const dest: string = destRootFolders.length === 1 ? destRootFolders[0] : destRootFolders[i]
            console.log(`convert-img-folder-to-pdf src_folders ${srcFolders[i]} dest_root_folder 
                ${dest} img_type ${img_type}`);
            const _resp: PythonPostCallResult<ConvertData> = await executePythonPostCall({
                "src_folder": srcFolders[i],
                "dest_folder": dest,
                "img_type": img_type,
                "commonRunId": commonRunId,
            }, 'convert-img-folder-to-pdf');

            result.push(_resp);
        }

        const stats = result.filter((x: PythonPostCallResult<ConvertData>) => x.status === true).length;
        console.log(`combinedResults convert-img-folder-to-pdf: ${stats} of ${result.length} processed successfully`);
        resp.status(200).send({
            response: {
                status: stats === result.length,
                _cumulativeMsg: `${stats} of ${result.length} processed successfully`,
                result,
            }
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
        }, 'mergePdfs', { timeoutMs: 4 * 60 * 60 * 1000, skipPreflight: true });

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
        const commonRunId = randomUUID();
        const pdfPathsToMergeCount = pdfPaths.length;
        let pdfPathsProcessedCount = 0;
        for (let pdfPath of pdfPaths) {
            const runId = randomUUID();
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

            const { anyCorrupted, results } = await anyPdfCorruptedQuick(
                [first_pdf_path, second_pdf_path, third_pdf_path].filter(p => typeof p === 'string' && p.length > 0)
            );
            if (anyCorrupted) {
                console.log(`Skipping ${first_pdf_path} and ${second_pdf_path} ${third_pdf_path.length > 0 ? `and ${third_pdf_path}` : ""} `)

                await saveMergeMultiplePdfTracker({
                    commonRunId,
                    pdfPathsToMergeCount,
                    runId,
                    first_pdf_path,
                    second_pdf_path,
                    ...(third_pdf_path ? { third_pdf_path } : {}),
                    operationResult: { status: false, message: "Corrupted PDFs", results },
                    moveResults: [],
                });

                continue;
            }

            console.log(`Merging ${first_pdf_path} and ${second_pdf_path} ${third_pdf_path.length > 0 ? `and ${third_pdf_path}` : ""} `)
            const _resp = await executePythonPostCall<MergePdfsResponseData>(pdfPathsAsBody, 'mergePdfs', { timeoutMs: 60 * 60 * 1000, skipPreflight: true });
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
            // Persist tracker document for this merge (service call)
            await saveMergeMultiplePdfTracker({
                commonRunId,
                pdfPathsToMergeCount,
                runId,
                first_pdf_path,
                second_pdf_path,
                ...(third_pdf_path ? { third_pdf_path } : {}),
                operationResult,
                moveResults,
            });

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

pythonRoute.post('/bulkRemoveAcrobatHeaderFooter', async (req: any, resp: any) => {
    try {
        const { input_folder, output_folder } = req.body;
        if (!input_folder || !output_folder) {
            return resp.status(400).send({
                response: {
                    success: false,
                    msg: "input_folder and output_folder are required"
                }
            });
        }
        console.log(`bulkRemoveAcrobatHeaderFooter input: ${input_folder} output: ${output_folder}`);
        const _resp = await executePythonPostCall({
            input_folder,
            output_folder,
            ...req.body
        }, 'bulkRemoveAcrobatHeaderFooter');

        resp.status(200).send({
            response: _resp
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
});
