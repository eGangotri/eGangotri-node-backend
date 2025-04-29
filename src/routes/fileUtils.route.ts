import * as express from 'express';
import { findTopNLongestFileNames } from '../utils/utils';
import { getDuplicatesOrUniquesBySize } from '../utils/FileUtils';
import { renameAllNonAsciiInFolder } from '../files/renameNonAsciiFiles';
import { callAksharamukha, DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL } from '../aksharamukha/convert';
import { convertJpgsToPdfInAllSubFolders } from '../imgToPdf/jpgToPdf';
import { multipleTextScriptConversion } from '../services/fileService';
import { renameFilesViaExcel } from '../services/fileUtilsService';
import { moveFileInListToDest, moveFilesInArray, moveFileSrcToDest } from '../services/yarnService';
import { FileMoveTracker } from '../models/FileMoveTracker';
import path from 'path';

export const fileUtilsRoute = express.Router();
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
        const moveResult = await moveFilesInArray(filesMovedNewAbsPath as string[], filesAbsPathMoved as string[], );
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

        console.log(`folder: ${folder} folder2: ${folder2}`);
        const result = await getDuplicatesOrUniquesBySize(folder, folder2, findDisjoint);
        resp.status(200).send({
            response: result
        });
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