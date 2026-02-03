import express from 'express';
import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { findTopNLongestFileNames } from '../utils/utils';
import { findInvalidFilePaths, getDuplicatesOrUniquesBySize, isValidPath, moveDuplicatesOrDisjointSetBySize, getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { renameAllNonAsciiInFolder } from '../files/renameNonAsciiFiles';
import { callAksharamukha, DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL } from '../aksharamukha/convert';
import { convertJpgsToPdfInAllSubFolders } from '../imgToPdf/jpgToPdf';
import { multipleTextScriptConversion } from '../services/fileService';
import { renameFilesViaExcel, renameFilesViaExcelUsingSpecifiedColumns } from '../services/fileUtilsService';
import { moveFileInListToDest, moveFilesInArray } from '../services/yarnService';
import { FileMoveTracker } from '../models/FileMoveTracker';
import { isPDFCorrupted } from '../utils/pdfValidator';
import { getAllPdfsInFoldersRecursive, mkDirIfDoesntExists } from '../imgToPdf/utils/Utils';
import { runHeaderFooterRemovalInLoop } from '../services/pythonRestService';
import { randomUUID } from 'crypto';
import AcrobatHeaderFooterRemovalHistory from '../models/AcrobatHeaderFooterRemovalHistory';
import AcrobatHeaderFooterRemovalPerItemHistory from '../models/AcrobatHeaderFooterRemovalPerItemHistory';

export const fileUtilsRoute = express.Router();
export const ISOLATED_FOLDER = "isolated";


fileUtilsRoute.get('/file-move-list', async (req, res) => {
    console.log(`GET /file-move-list`);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await FileMoveTracker.countDocuments();
        const fileMoveTrackers = await FileMoveTracker.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            data: fileMoveTrackers,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        console.error('Error fetching file move trackers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

fileUtilsRoute.post('/reverse-file-move', async (req: any, resp: any) => {
    console.log(`reverse-file-move ${JSON.stringify(req.body)} `)
    try {
        const id = req?.body?.id;
        if (!id) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide File Move Tracker Id"
                }
            });
        }
        const fileMoveTracker = await FileMoveTracker.findById(id);
        if (!fileMoveTracker) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "File Move Tracker not found"
                }
            });
        }
        const { filesAbsPathMoved, filesMovedNewAbsPath, reversed } = fileMoveTracker;
        if (reversed) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Already Reversed"
                }
            });
        }
        const moveResult = await moveFilesInArray(filesMovedNewAbsPath as string[], filesAbsPathMoved as string[],);
        if (moveResult.success) {
            fileMoveTracker.reversed = true;
            await fileMoveTracker.save();
        }
        console.log(`moveResult ${JSON.stringify(moveResult)} `)
        resp.status(200).send({
            response: {
                ...moveResult
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/findByFileSize', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder1;
        const folder2 = req.body.folder2;
        const findDisjoint = req.body.findDisjoint || false;
        const moveItems = req.body.moveItems || false;
        console.log(`folder: ${folder} folder2: ${folder2}`);
        if (moveItems) {
            const result = await moveDuplicatesOrDisjointSetBySize(folder, folder2, findDisjoint);
            resp.status(200).send({
                response: result
            });
        }
        else {
            const result = await getDuplicatesOrUniquesBySize(folder, folder2, findDisjoint);
            resp.status(200).send({
                response: result
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


fileUtilsRoute.post('/moveFilesAsCSVOfAbsPaths', async (req: any, resp: any) => {
    console.log(`moveFilesAsCSVOfAbsPaths ${JSON.stringify(req.body)} `)
    try {
        const absPathsAsCSV = req?.body?.absPathsAsCSV || "";
        const profileOrFolder = req?.body?.profileOrFolder || "";
        const absolutePaths = absPathsAsCSV?.split(",").map((item: string) => item.trim());

        console.log(`moveFilesAsCSVOfAbsPaths count: ${absolutePaths?.length} to profileOrFolder(${profileOrFolder})`)
        if (!absolutePaths && !profileOrFolder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Src and Dest Items"
                }
            });
        }
        const _moveResponse = await moveFileInListToDest({ absolutePaths }, profileOrFolder);
        resp.status(200).send({
            response: {
                ..._moveResponse
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/topLongFileNames', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const topN = req.body.topN || 1;
        const includePathInCalc = req.body.includePathInCalc || false;
        console.log(`folder: ${folder} topN: ${topN} includePathInCalc: ${includePathInCalc}`);
        const longestFileName = await findTopNLongestFileNames(folder, topN, includePathInCalc);
        resp.status(200).send({
            response: {
                googleDriveLimit: "Google Drive API has a limit of 255 characters for file names - path inclusive",
                msg: `Top ${longestFileName.length} Longest File Names in ${folder} are:`,
                longestFileName: longestFileName.map((item: any) => {
                    return `${item} (${item.length})`
                })
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/renameNonAsciiFiles', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const script = req.body.script;

        console.log(`folder: ${folder} folder: ${folder} language: ${script}`);
        const renamedFiles = await renameAllNonAsciiInFolder(folder, script);
        resp.status(200).send({
            response: {
                src: folder,
                destination: `${folder}/${DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL}`,
                msg: `${renamedFiles.length} files renamed from ${folder} and copied to ${folder}/${DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL}.`,
                renamedFiles
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


fileUtilsRoute.post('/convertMultipleTxtFileEncodings', async (req: any, resp: any) => {
    try {
        const folderPath = req.body.folderPath;
        const scriptFrom = req.body.scriptFrom;
        const scriptTo = req.body.scriptTo;
        const multiplTextConversionReport = await multipleTextScriptConversion(folderPath, scriptFrom, scriptTo);
        resp.status(200).send({
            response: {
                multiplTextConversionReport
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/convertScript', async (req: any, resp: any) => {
    try {
        const text = req.body.text;
        const scriptFrom = req.body.scriptFrom;
        const scriptTo = req.body.scriptTo;

        console.log(`folderPath: ${text} scriptFrom: ${scriptFrom} scriptTo: ${scriptTo}`);
        try {
            const payload = {
                "source": scriptFrom,
                "target": scriptTo,
                "text": text,
                "nativize": true,
                "postOptions": [],
                "preOptions": []
            }
            console.log(`payload: ${JSON.stringify(payload)}`);
            const scriptConvertedContents = await callAksharamukha(payload, true);
            resp.status(200).send({
                response: {
                    src: text,
                    msg: `${scriptFrom} to ${scriptTo}.`,
                    scriptConvertedContents,
                }
            });

        } catch (error) {
            console.error(`Error ${scriptFrom} to ${scriptTo}.`, error);
            resp.status(400).send({
                response: {
                    src: text,
                    msg: `${scriptFrom} to ${scriptTo}.`,
                    error,
                }
            });
        }
    }




    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
/**
 * doesnt work for 2TB+. better to use imgFilesToPdfGradleVersion Gradle Version
 */
fileUtilsRoute.post('/imgFilesToPdfDeprecated', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const imgType = req.body.imgType;
        const results = [];
        const _folder = folder.includes(",") ? folder.split(",").map((link: string) => link.trim()) : [folder.trim()];
        console.log(`deprecated:imgFilesToPdf:folder: ${folder} imgType: ${imgType}`);

        for (const aFolder of _folder) {
            let res = {};
            switch (imgType) {
                case "JPG":
                    res = await convertJpgsToPdfInAllSubFolders(aFolder);
                    break;

                case "PNG":
                    res = { msg: "PNG to PDF conversion is not supported yet." };
                    break;

                case "TIFF":
                    res = { msg: "TIFF to PDF conversion is not supported yet." };
                    break;
            }

            results.push(res);
        }

        const resultsSummary = results.map((res: { success_count: number, exception_count: number, error_count: number }, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count} Exception Count: ${res.exception_count} Total: ${res.success_count + res.error_count}`;
        });

        resp.status(200).send({
            total: _folder.length,
            resultsSummary,
            response: results
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


fileUtilsRoute.post('/renameFilesViaExcel', async (req: any, resp: any) => {
    try {
        const excelPath = req.body.excelPath;
        const folderOrProfile = req.body.folderOrProfile;

        console.log(`excelPath: ${excelPath} folderOrProfile: ${folderOrProfile}`);
        const res = await renameFilesViaExcel(excelPath, folderOrProfile);
        console.error(`${JSON.stringify(res.errorList)}`)
        const ignoredCount = res?.totalInFolder - res?.totalInExcel
        const warning = ((res?.totalInFolder > 0) && res.success?.length === 0)
        resp.status(200).send({
            response: {
                totalInFolder: `Total Files that were in Folder(s): ` + res?.totalInFolder,
                totalInExcel: `Total Files that were in Excel: ` + res?.totalInExcel,
                msg: `Files renamed via Excel: ` + res.success?.length,
                ignored: `Files that were ignored due to no data: ${ignoredCount}`,
                errorList: `File rename-errors in Excel: ` + res.errorList?.length,
                warning: warning ? "check Col. N&O. for un-interpreted formulas in Excel" : "",
                errors: res.errorList
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/renameFilesViaExcelUsingSpecifiedColumns', async (req: any, resp: any) => {
    try {
        const excelPath = req.body.excelPath;
        const folderOrProfile = req.body.folderOrProfile;
        const columns = req.body.columns;

        console.log(`excelPath: ${excelPath} folderOrProfile: ${folderOrProfile} columns: ${columns}`);
        const [col1, col2] = columns.split("-").map((x: string) => parseInt(x));
        console.log(`col1: ${col1} col2: ${col2}`);
        if (!excelPath || !folderOrProfile || !columns) {
            return resp.status(400).send({
                response: {
                    success: false,
                    message: "excelPath, folderOrProfile and columns are required"
                }
            });
        }

        if (isNaN(col1) || isNaN(col2)) {
            return resp.status(400).send({
                response: {
                    success: false,
                    message: "columns must be numbers separated by -"
                }
            });
        }

        const res = await renameFilesViaExcelUsingSpecifiedColumns(excelPath, folderOrProfile, col1, col2);
        console.error(`${JSON.stringify(res.errorList)}`)
        const missedCount = res?.totalInExcel - res?.totalInFolder;
        const warning = ((res?.totalInFolder > 0) && res.success?.length === 0)
        resp.status(200).send({
            response: {
                totalInFolder: `Total Files that were in Folder(s): ` + res?.totalInFolder,
                totalInExcel: `Total Files that were in Excel: ` + res?.totalInExcel,
                msg: `Files renamed via Excel: ` + res.success?.length,
                missed: `Files that were missed due to no data: ${missedCount}`,
                errorList: `File rename-errors in Excel: ` + res.errorList?.length,
                warning: warning ? "check Col. N&O. for un-interpreted formulas in Excel" : "",
                errors: res.errorList
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/corruptPdfCheck', async (req: any, resp: any) => {
    try {
        const folderOrProfile = req.body.folderOrProfile || "";
        const deepCheck = req.body.deepCheck || false;
        const isolateCorrupted = req.body.isolateCorrupted || false;
        if (!folderOrProfile || folderOrProfile === "") {
            return resp.status(400).send({
                response: {
                    success: false,
                    message: "folderOrProfile is mandatory"
                }
            });
        }

        const _profiles = folderOrProfile.includes(",") ?
            folderOrProfile.split(",").map((p: string) => p.trim()) :
            [folderOrProfile.trim()];

        const profilesAsFolders = _profiles.map((p: string) => getPathOrSrcRootForProfile(p));
        console.log(`:corruptPdfCheck:profilesAsFolders: ${profilesAsFolders} folderOrProfile   ${folderOrProfile}`);
        const invalidPAths = await findInvalidFilePaths(profilesAsFolders);
        if (invalidPAths.length > 0) {
            console.log(`:corruptPdfCheck:invalidPAths: ${invalidPAths}`);
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": `Invalid paths: ${invalidPAths} in ${profilesAsFolders}`
                }
            });
        }

        // Use the recursive function to find PDFs in all subfolders
        const _pdfs = await getAllPdfsInFoldersRecursive(profilesAsFolders);
        console.log(`/corruptPdfCheck:pdfs count for upload in ${_profiles.length} profiles ${_pdfs.length} (including subfolders)`)
        const corruptionCheck = []

        if (_pdfs.length === 0) {
            resp.status(400).send({
                success: false,
                message: `Cannot proceed. Empty folder(s) ${profilesAsFolders.join(", ")}`
            });
            return;
        }
        for (let pdf of _pdfs) {
            corruptionCheck.push(isPDFCorrupted(pdf, { quickCheck: !deepCheck }))
        }

        const corruptionCheckRes = await Promise.all(corruptionCheck)
        const isCorrupted = corruptionCheckRes.filter(result => !result.isValid)
        console.log(`Corruption Check Done. isCorrupted ${isCorrupted.length}`)
        if (isCorrupted.length > 0) {
            let isolationMsg = ""
            if (isolateCorrupted) {
                const isolatedCorrupted = isCorrupted.map(x => x.filePath)
                try {
                    for (let pdf of isolatedCorrupted) {
                        const pdfName = path.basename(pdf)
                        const pdfPath = path.dirname(pdf)
                        const _isolatedPath = path.join(pdfPath, ISOLATED_FOLDER)
                        const newPath = path.join(_isolatedPath, pdfName)
                        await mkDirIfDoesntExists(_isolatedPath);
                        console.log(`Isolating Corrupted PDF: ${pdf} to ${newPath}`)
                        await fsPromise.rename(pdf, newPath);
                    }
                    isolationMsg = `Isolated Corrupted PDFs: ${isolatedCorrupted.length}`
                }
                catch (err) {
                    console.log(`Error isolating corrupted PDFs: ${err}`)
                    isolationMsg = `Error isolating corrupted PDFs: ${err}`
                }
            }
            resp.status(400).send({
                response: {
                    success: false,
                    message: `Cannot proceed.\r\nFollowing (${isCorrupted.length}) PDFs are corrupted: 
                    isCorrupted: ${JSON.stringify(isCorrupted.map(x => x.error).join(", "))}
                    \r\n${isCorrupted.map(x => x.filePath).join(", ")}
                    \r\nDeep Check: ${deepCheck}
                    \r\n${isolationMsg}`
                }
            });
            return;
        }
        resp.status(200).send({
            response: {
                success: true,
                message: `Corruption Check Done.
                 No corrupted PDFs found in ${folderOrProfile} holding ${_pdfs.length} PDFs.
                 Deep Check: ${deepCheck}`
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({ response: err });
    }
})

fileUtilsRoute.post('/removeHeaderFooter', async (req: any, resp: any) => {

    try {
        const folderOrProfile = req.body.folderOrProfile || "";
        const overrideNonEmpty = req.body.overrideNonEmpty || false;
        if (!folderOrProfile || folderOrProfile === "") {
            return resp.status(400).send({
                response: {
                    success: false,
                    message: "folderOrProfile is mandatory"
                }
            });
        }


        const _profiles = folderOrProfile.includes(",") ?
            folderOrProfile.split(",").map((p: string) => p.trim()) :
            [folderOrProfile.trim()];

        const profilesAsFolders = _profiles.map((p: string) => getPathOrSrcRootForProfile(p));
        const destination = req.body.destination || profilesAsFolders[0];

        // Fast check if destination is not empty and override is false
        if (!overrideNonEmpty) {
            try {
                const destEntries = await fsPromise.readdir(destination);
                if (destEntries.length > 0) {
                    resp.status(400).send({
                        response: {
                            "status": "failed",
                            "success": false,
                            "message": `Destination folder ${destination} is not empty. Use override to proceed.`
                        }
                    });
                    return;
                }
            } catch (e) {
                console.log(`removeHeaderFooter: ${e}`)
            }
        }

        const commonRunId = randomUUID()
        const headerFooterRemovalResp = await runHeaderFooterRemovalInLoop(profilesAsFolders, destination, commonRunId);
        resp.status(200).send(headerFooterRemovalResp);
    }
    catch (error: any) {
        console.log('Error', error);
        resp.status(400).send({ response: error });
    }

})

fileUtilsRoute.get('/header-footer-removal-report', async (req, res) => {
    console.log(`GET /header-footer-removal-report`);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await AcrobatHeaderFooterRemovalHistory.countDocuments();
        const history = await AcrobatHeaderFooterRemovalHistory.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            data: history,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        console.error('Error fetching header footer removal history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

fileUtilsRoute.get('/header-footer-removal-item-details', async (req, res) => {
    const runId = (req.query.runId || req.query.commonRunId) as string;
    console.log(`GET /header-footer-removal-item-details runId: ${runId}`);
    try {
        if (!runId) {
            return res.status(400).json({ error: 'runId is required' });
        }

        // Search both commonRunId (batch) and runId (individual item)
        const details = await AcrobatHeaderFooterRemovalPerItemHistory.find({
            $or: [{ commonRunId: runId }, { runId: runId }]
        }).sort({ createdAt: 1 });

        res.json({
            data: details,
            totalCount: details.length
        });
    } catch (error) {
        console.error('Error fetching header footer removal item details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

fileUtilsRoute.get('/header-footer-removal-item-report', async (req, res) => {
    console.log(`GET /header-footer-removal-item-report`);
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await AcrobatHeaderFooterRemovalPerItemHistory.countDocuments();
        const history = await AcrobatHeaderFooterRemovalPerItemHistory.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            data: history,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        console.error('Error fetching header footer removal item report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

