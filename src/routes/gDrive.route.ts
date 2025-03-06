import * as express from 'express';
import { downloadFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import {  DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT } from '../cliBased/pdf/utils';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE } from '../cliBased/googleapi/_utils/constants';
import { genLinksAndFolders, validateGenGDriveLinks } from '../services/yarnListMakerService';
import { generateGoogleDriveListingExcel, getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { formatTime } from '../imgToPdf/utils/Utils';
import { convertGDriveExcelToLinkData, downloadGDriveData } from '../services/GDriveItemService';
import { isValidPath } from '../utils/FileUtils';
import { getFolderInSrcRootForProfile } from '../archiveUpload/ArchiveProfileUtils';
import { verifyGDriveLocalIntegrity } from '../services/GDriveService';
import * as FileConstUtils from '../utils/constants';

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
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }

        const links = googleDriveLink.includes(",") ? googleDriveLink.split(",").map((link: string) => link.trim()) : [googleDriveLink.trim()];
        const downloadCounterController = Math.random().toString(36).substring(7);
        
        // Process all downloads concurrently using Promise.all
        const downloadPromises = links.map((link: string, index: number) => {
            console.log(`:downloadFromGoogleDrive:loop ${index + 1} ${link} ${profile} ${ignoreFolder} ${fileType} ${downloadCounterController}`);
            return downloadFromGoogleDriveToProfile(link, profile, ignoreFolder, fileType, `${downloadCounterController}-${index}`);
        });

        // Wait for all downloads to complete
        const results = await Promise.all(downloadPromises);
        
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
    console.log(`getGoogleDriveListingAsExcel:req.body ${JSON.stringify(req.body)}`)
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        const ignoreFolder = req?.body?.ignoreFolder
        const allNotJustPdfs = req?.body?.allNotJustPdfs || false;
        const pdfRenamerXlV2 = req?.body?.pdfRenamerXlV2 || false;

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
                    console.log(`getGoogleDriveListingAsExcel:loop ${_links[i]} ${_folders[i]} (${allNotJustPdfs})`)
                    const rowCounterController = Math.random().toString(36).substring(7);
                    FileConstUtils.resetRowCounter(rowCounterController);
                    const listingResult = await generateGoogleDriveListingExcel(_links[i],
                        _folders[i], reduced,
                        ignoreFolder,
                        pdfRenamerXlV2,
                        allNotJustPdfs ? "" : PDF_TYPE,rowCounterController);
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
        const _results = await downloadGDriveData(excelLinksData, profileOrPath,downloadCounterController);

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
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderOrProfile = req?.body?.folderOrProfile || "";
        const ignoreFolder = req?.body?.ignoreFolder || "proc";
        const fileType = req?.body?.fileType || PDF_TYPE;

        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)

        console.log(`verifyLocalDownloadSameAsGDrive googleDriveLink:
         ${googleDriveLink} /
         ${folder} /
         ${ignoreFolder} /
         ${fileType}`)

        if (!googleDriveLink || !folder) {
            resp.status(400).send({
                response: "Pls. provide google drive Link or Folder"
            })
            return;
        }

        const { _links, _folders, error } = genLinksAndFolders(googleDriveLink, folder)
        if (error) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Number of Links and Folder Names should match"
                }
            });
            return;
        }
        const integrityCheck = await verifyGDriveLocalIntegrity(_links, _folders, ignoreFolder, fileType);
        resp.status(200).send(integrityCheck);
        return;
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
