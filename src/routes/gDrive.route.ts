import * as express from 'express';
import { downloadFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, resetDownloadCounters } from '../cliBased/pdf/utils';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { genLinksAndFolders, validateGenGDriveLinks } from '../services/yarnListMakerService';
import { generateGoogleDriveListingExcel, getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { formatTime } from '../imgToPdf/utils/Utils';
import { convertGDriveExcelToLinkData, downloadGDriveData } from '../services/GDriveItemService';
import { GoogleApiData } from 'cliBased/googleapi/types';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_EXT } from '../imgToPdf/utils/constants';
import { isValidPath } from '../utils/utils';
import { getFolderInSrcRootForProfile } from '../archiveUpload/ArchiveProfileUtils';

export const gDriveRoute = express.Router();

//
gDriveRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        const ignoreFolder = req?.body?.ignoreFolder || "proc";
        const fileType = req?.body?.fileType || PDF_TYPE;

        console.log(`:downloadFromGoogleDrive:
        googleDriveLink:
         ${googleDriveLink?.split(",").map((link: string) => link + "\n ")} 
        profile ${profile} fileType ${fileType} ignoreFolder ${ignoreFolder}`)
        if (!googleDriveLink || !profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }
        const results = [];
        const links = googleDriveLink.includes(",") ? googleDriveLink.split(",").map((link: string) => link.trim()) : [googleDriveLink.trim()];
        resetDownloadCounters();
        for (const [index, link] of links.entries()) {
            const res = await downloadFromGoogleDriveToProfile(link, profile, ignoreFolder, fileType);
            results.push(res);
        }
        const resultsSummary = results.map((res: any, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count} Wrong Size: ${res.dl_wrong_size_count}`;
        });
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download for /downloadFromGoogleDrive: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            resultsSummary,
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})




gDriveRoute.post('/getGoogleDriveListingAsExcel', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListingAsExcel ${JSON.stringify(req.body)}`)
    const startTime = Date.now();

    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        const ignoreFolder = req?.body?.ignoreFolder
        const allNotJustPdfs = req?.body?.allNotJustPdfs || false;
        const pdfRenamerXlV2 = req?.body?.pdfRenamerXlV2 || false;

        console.log(`getGoogleDriveListingAsExcel googleDriveLink:
         ${googleDriveLink}/${folderName}/${reduced}/${ignoreFolder}/${allNotJustPdfs}/${pdfRenamerXlV2}`)

        const _validations = validateGenGDriveLinks(googleDriveLink, folderName)
        if (_validations.success === false) {
            resp.status(300).send({
                response: _validations
            })
        }

        const { _links, _folders, error } = genLinksAndFolders(googleDriveLink, folderName)
        if (error) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Number of Links and Folder Names should match"
                }
            });
            return
        }

        const _resps = [];
        for (let i = 0; i < _links.length; i++) {
            console.log(`getGoogleDriveListingAsExcel ${_links[i]} ${_folders[i]} (${allNotJustPdfs})`)
            const listingResult = await generateGoogleDriveListingExcel(_links[i],
                _folders[i], reduced,
                ignoreFolder,
                pdfRenamerXlV2,
                allNotJustPdfs ? "" : PDF_TYPE);
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
        return;
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
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Excel Path and profile/abs-path. Both are mandatory"
                }
            });
        }
        const excelLinksData = convertGDriveExcelToLinkData(excelPath);
        resetDownloadCounters()
        const _results = await downloadGDriveData(excelLinksData, profileOrPath);

        console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT}`);
        console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT}`);
        const _resp = {
            status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT} made it`,
            success_count: DOWNLOAD_COMPLETED_COUNT,
            error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT,
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
    const startTime = Date.now();

    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderOrProfile = req?.body?.folderOrProfile || "";
        const ignoreFolder = req?.body?.ignoreFolder
        const fileType = req?.body?.fileType || PDF_TYPE;

        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)

        console.log(`verifyLocalDownloadSameAsGDrive googleDriveLink:
         ${googleDriveLink}/${folder}/${ignoreFolder}/${fileType}`)

        const _validations = validateGenGDriveLinks(googleDriveLink, folder)
        if (_validations.success === false) {
            resp.status(300).send({
                response: _validations
            })
        }

        const { _links, _folders, error } = genLinksAndFolders(googleDriveLink, folder)
        if (error) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Number of Links and Folder Names should match"
                }
            });
            return
        }

        const _resps = [];
        const _resps2 = [];
        for (let i = 0; i < _links.length; i++) {
            console.log(`getGoogleDriveListingAsExcel ${_links[i]} ${_folders[i]} (${fileType})`)
            const googleDriveFileData: Array<GoogleApiData> = 
            await getGDriveContentsAsJson(_links[i],"", ignoreFolder, fileType);
           _resps.push(googleDriveFileData);
           const fileStats = await getAllFileStats({
            directoryPath: _folders[i], 
            filterExt: fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? [ZIP_EXT] : []),
            ignoreFolders: ignoreFolder,
            withLogs: false,
            withMetadata: true,
           });
           _resps2.push(fileStats)
        }
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download google drive Listings: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            response: {
                googleDriveFileData: _resps,
                fileStats: _resps2
            }
        });
        return;
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

