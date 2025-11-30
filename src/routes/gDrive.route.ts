import * as express from 'express';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import * as path from 'path';
import { downloadFromGoogleDriveToProfile, MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, resetDownloadCounters } from '../cliBased/pdf/utils';

import { listFolderContentsAsArrayOfData } from '../cliBased/googleapi/service/GoogleApiService';
import { getGoogleDriveInstance } from '../cliBased/googleapi/service/CreateGoogleDrive';

import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { genLinksAndFolders, validateGenGDriveLinks } from '../services/yarnListMakerService';
import { generateGoogleDriveListingExcel, getFolderNameFromGDrive } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { formatTime } from '../imgToPdf/utils/Utils';
import { convertGDriveExcelToLinkData, downloadGDriveData } from '../services/GDriveItemService';
import { findInvalidFilePaths, isValidPath, getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { GDRIVE_DEFAULT_IGNORE_FOLDER, verifyGDriveLocalIntegirtyPerLink, verifyGDriveLocalIntegrity } from '../services/GDriveService';
import { verifyUnzipSuccessInDirectory } from '../services/zipService';
import { markVerifiedForGDriveDownload } from '../services/gDriveDownloadService';
import GDriveDownload from '../models/GDriveDownloadHistorySchema';
import { extractGoogleDriveId } from '../mirror/GoogleDriveUtilsCommonCode';
import { createManuExcelVersion, createMimimalExcelVersion, ExcelWriteResult } from '../cliBased/excel/ExcelUtils';
import { redownloadFromGDriveService, RedownloadHttpError, verifyLocalDownloadSameAsGDriveService } from '../services/GDriveDownloadVerifyService';

export const gDriveRoute = express.Router();
const drive = getGoogleDriveInstance();

//
gDriveRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        const ignoreFolder = req?.body?.ignoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;
        const fileType = req?.body?.fileType || PDF_TYPE;

        console.log(`:downloadFromGoogleDrive:
        googleDriveLink:
         ${googleDriveLink?.split(",").map((link: string) => link + "\n ")} 
        profile ${profile} fileType ${fileType} ignoreFolder ${ignoreFolder}`)
        if (!googleDriveLink || !profile) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }

        const links = googleDriveLink.includes(",") ? googleDriveLink.split(",").map((link: string) => link.trim()) : [googleDriveLink.trim()];
        const profiles = profile.includes(",") ?
            profile.split(",").map((p: string) => p.trim()) :
            Array(links.length).fill(profile.trim());

        // Check total file count across all links before proceeding
        let totalFileCount = 0;
        for (const link of links) {
            const fileId = extractGoogleDriveId(link);
            const googleDriveData = await listFolderContentsAsArrayOfData(fileId, drive, "", ignoreFolder, fileType, randomUUID());
            if (googleDriveData.length > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE) {
                console.log(`:downloadFromGoogleDrive:googleDriveData.length > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE: ${googleDriveData.length} > ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}`)
                return resp.status(400).send({
                    response: {
                        "status": "failed",
                        "message": `Total ${fileType} files (${googleDriveData.length}) exceeds maximum limit of ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}. Please download in smaller batches.`
                    }
                });
            }
            totalFileCount += googleDriveData.length;
        }

        if (totalFileCount > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE) {
            console.log(`:downloadFromGoogleDrive:totalFileCount > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE: ${totalFileCount} > ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}`)
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": `Total ${fileType} files (${totalFileCount}) exceeds maximum limit of ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}. Please download in smaller batches.`
                }
            });
        }

        const profilesAsFolders = profiles.map((p: string) => getPathOrSrcRootForProfile(p));
        const invalidPAths = await findInvalidFilePaths(profilesAsFolders);
        if (invalidPAths.length > 0) {
            console.log(`:downloadFromGoogleDrive:invalidPAths: ${invalidPAths}`);
            return resp.status(400).send({
                response: {
                    "message": `Invalid paths: ${invalidPAths} in ${profilesAsFolders}`
                }
            });
        }
        const commonRunId = randomUUID();
        // Process all downloads concurrently using Promise.all
        const downloadPromises = links.map((link: string, index: number) => {
            const runId = randomUUID();
            console.log(`:downloadFromGoogleDrive:loop ${index + 1} ${link} 
                ${profilesAsFolders} ${ignoreFolder} ${fileType} ${runId} ${commonRunId}`);
            return downloadFromGoogleDriveToProfile(link, profilesAsFolders[index], ignoreFolder, fileType, runId, commonRunId);
        });

        // Wait for all downloads to complete
        const results = await Promise.all(downloadPromises);

        const resultsSummary = results.map((res: any, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count} Wrong Size: ${res.dl_wrong_size_count}`;
        });

        const rootFolders = await Promise.all(links.map(async (link: string) => await getFolderNameFromGDrive(link) || ""));
        const foldersWithRoot = profiles.map((folder: string, index: number) => {
            const fileDumpFolder = getPathOrSrcRootForProfile(folder);
            return path.join(fileDumpFolder, rootFolders[index]);
        });

        console.log(`downloadFromGoogleDrive:foldersWithRoot: ${foldersWithRoot}  ${rootFolders}`);
        const testResult = await verifyGDriveLocalIntegrity(links, foldersWithRoot, ignoreFolder, fileType);

        for (let i = 0; i < results.length; i++) {
            const gDriveDownloadTaskId = results[i].gDriveDownloadTaskId;
            const success = testResult.response.comparisonResult[i].success as boolean;
            await markVerifiedForGDriveDownload(gDriveDownloadTaskId, success);
        }

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download for /downloadFromGoogleDrive: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            msg: `${links.length} links attempted-download to ${profiles.length} profiles`,
            timeTaken: timeInfo(timeTaken),
            resultsSummary,
            response: results,
            testResult: testResult.response
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

gDriveRoute.post('/getGoogleDriveListingAsExcel', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListingAsExcel:req.body ${JSON.stringify(req.body)}`)
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        const ignoreFolder = req?.body?.ignoreFolder
        const allNotJustPdfs = req?.body?.allNotJustPdfs || false;
        const pdfRenamerXlV2 = req?.body?.pdfRenamerXlV2 || false;
        const minimalVersion = req?.body?.minimalVersion || false;
        const manuVersion = req?.body?.manuVersion || false;

        console.log(`getGoogleDriveListingAsExcel 
            googleDriveLink:
         ${googleDriveLink}/${folderName}/${reduced}/${ignoreFolder}/${allNotJustPdfs}/${pdfRenamerXlV2}`)

        const _validations = validateGenGDriveLinks(googleDriveLink, folderName)
        if (_validations.success === false) {
            console.log(`getGoogleDriveListingAsExcel:validation failed ${JSON.stringify(_validations)}`)
            resp.status(400).send({
                response: _validations
            });
        }

        else {
            const { _links, _folders, error } = genLinksAndFolders(googleDriveLink, folderName)
            if (error) {
                console.log(`getGoogleDriveListingAsExcel:genLinksAndFolders failed ${JSON.stringify(error)}`)
                resp.status(400).send({
                    response: {
                        "status": "failed",
                        "success": false,
                        "message": "Number of Links and Folder Names should match"
                    }
                });
            }

            else {
                const _resps = [];
                for (let i = 0; i < _links.length; i++) {
                    const rowCounterController = Math.random().toString(36).substring(7);
                    console.log(`getGoogleDriveListingAsExcel:loop ${_links[i]} ${_folders[i]} (${allNotJustPdfs}) ${rowCounterController}`)
                    const listingResult: ExcelWriteResult | null = await generateGoogleDriveListingExcel(_links[i],
                        _folders[i],
                        reduced,
                        ignoreFolder,
                        pdfRenamerXlV2,
                        allNotJustPdfs === true ? "" : PDF_TYPE,
                        rowCounterController);
                    if (listingResult.success && (manuVersion || minimalVersion)) {
                        const excelName = listingResult.xlsxFileNameWithPath;
                        if (manuVersion) {
                            const manuVersionResult = createManuExcelVersion(excelName);
                            listingResult.success2 = manuVersionResult.success2;
                            listingResult.msg2 = manuVersionResult.msg2;
                        }
                        else if (minimalVersion) {
                            const minimalVersionResult = createMimimalExcelVersion(excelName);
                            listingResult.success2 = minimalVersionResult.success2;
                            listingResult.msg2 = minimalVersionResult.msg2;
                        }
                    }
                    _resps.push(listingResult);
                }
                const endTime = Date.now();
                const timeTaken = endTime - startTime;
                console.log(`Time taken to download google drive Listings: ${timeInfo(timeTaken)}`);

                resp.status(200).send({
                    timeTaken: timeInfo(timeTaken),
                    response: {
                        reduced: reduced ? "Yes" : "No",
                        allNotJustPdfs: allNotJustPdfs ? "Yes" : "No",
                        ..._resps,
                    }
                });
            }
        }
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


gDriveRoute.post('/downloadGDriveItemsViaExcel', async (req: any, resp: any) => {
    try {
        const excelPath = req?.body?.excelPath;
        const profileOrPath = req?.body?.profileOrPath;
        const startTime = Date.now();

        if (!excelPath || !profileOrPath) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Excel Path and profile/abs-path. Both are mandatory"
                }
            });
        }
        const checkValidPath = isValidPath(excelPath);
        if (!checkValidPath) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": `Invalid Excel (${excelPath}). Pls. provide a valid Excel`
                }
            });
        }
        const excelLinksData = convertGDriveExcelToLinkData(excelPath);
        const downloadCounterController = Math.random().toString(36).substring(7);
        const _results = await downloadGDriveData(excelLinksData, profileOrPath, downloadCounterController);

        console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT(downloadCounterController)}`);
        console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController)}`);
        const _resp = {
            status: `${DOWNLOAD_COMPLETED_COUNT(downloadCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT(downloadCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController)} made it`,
            success_count: DOWNLOAD_COMPLETED_COUNT(downloadCounterController),
            error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController),
            ..._results
        }

        console.log(`_resp : ${JSON.stringify(_resp)}`);

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download archiveItems from Excel: ${formatTime(timeTaken)}`);
        resp.status(200).send({
            timeTaken: formatTime(timeTaken),
            response: _resp
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

gDriveRoute.post('/verifyLocalDownloadSameAsGDrive', async (req: any, resp: any) => {
    console.log(`verifyLocalDownloadSameAsGDrive ${JSON.stringify(req.body)}`)
    try {
        const id = req?.body?.id || "";
        const verifyBySizeOnly = req?.body?.verifyBySizeOnly || false;
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        const downloadType = req?.body?.downloadType;
        const ignoreFolder = req?.body?.ignoreFolder;

        const result = await verifyLocalDownloadSameAsGDriveService({
            id,
            googleDriveLink,
            profile,
            downloadType,
            ignoreFolder,
            verifyBySizeOnly,
        });

        resp.status(result.statusCode).send(result.body);
    }
    catch (err: any) {
        if (err instanceof RedownloadHttpError) {
            resp.status(err.statusCode).send(err.body);
        } else {
            console.log('Error', err);
            resp.status(400).send(err);
        }
    }
})

gDriveRoute.post('/verifyLocalDownloadSameAsGDriveMulti', async (req: any, resp: any) => {
    console.log(`verifyLocalDownloadSameAsGDrive ${JSON.stringify(req.body)}`)
    try {
        const selectedIds = req?.body?.selectedIds;

        if (!selectedIds || selectedIds.length === 0) {
            return resp.status(400).json({ status: 'failed', message: 'atleast one selectedId is required' });
        }
        const results = []
        for (const selectedId of selectedIds) {
            try {
                const result = await verifyLocalDownloadSameAsGDriveService({ id: selectedId });
                results.push(result.body);
            }
            catch (error: any) {
                console.error(`/ aiRenamer /:runId retry error: ${error?.message || String(error)} `);
                results.push({ status: 'failed', message: error?.message || String(error) });
            }
        }
        return resp.status(200).json(results);
    } catch (error: any) {
        console.error(`/ aiRenamer /:runId retry error: ${error?.message || String(error)} `);
        return resp.status(500).json({ status: 'failed', message: error?.message || String(error) });
    }
})

gDriveRoute.post('/redownloadFromGDrive', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const id = req?.body?.id || '';

        const result = await redownloadFromGDriveService({ id });

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download for /redownloadFromGDrive: ${timeInfo(timeTaken)}`);

        resp.status(result.statusCode).send(result.body);
    }
    catch (err: any) {
        if (err instanceof RedownloadHttpError) {
            resp.status(err.statusCode).send(err.body);
        } else {
            console.log('Error', err);
            resp.status(400).send(err);
        }
    }
})

gDriveRoute.post('/redownloadFromGDriveMulti', async (req: any, resp: any) => {

    try {
        const selectedIds = req?.body?.selectedIds;

        if (!selectedIds || selectedIds.length === 0) {
            return resp.status(400).json({ status: 'failed', message: 'atleast one selectedId is required' });
        }
        const results = []
        for (const selectedId of selectedIds) {
            try {
                const result = await redownloadFromGDriveService({ id: selectedId });
                results.push(result.body);
            }
            catch (error: any) {
                console.error(`/ aiRenamer /:runId retry error: ${error?.message || String(error)} `);
                results.push({ status: 'failed', message: error?.message || String(error) });
            }
        }
        return resp.status(200).json(results);
    } catch (error: any) {
        console.error(`/ redownloadFromGDriveMulti error: ${error?.message || String(error)} `);
        return resp.status(500).json({ status: 'failed', message: error?.message || String(error) });
    }
});


gDriveRoute.get("/getRefreshToken", async (req: any, resp: any) => {
    try {
        exec("npm run --silent get-refresh-token", { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                console.log('Error executing get-refresh-token:', error);
                resp.status(500).send({ error: String(error), stderr: String(stderr) });
                return;
            }
            resp.status(200).send({ output: String(stdout).trim(), stderr: String(stderr).trim() });
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})