import * as express from 'express';
import { downloadFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { getFolderInSrcRootForProfile } from '../archiveUpload/ArchiveProfileUtils';
import { moveFileSrcToDest, moveItemsInListOfProfileToFreeze, moveProfilesToFreeze } from '../services/yarnService';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { vanitizePdfForProfiles } from '../vanityService/VanityPdf';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { compareFolders } from '../folderSync';
import { markUploadCycleAsMovedToFreeze } from '../services/uploadCycleService';
import { ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { unzipAllFilesInDirectory } from '../services/zipService';
import { FileMoveTracker } from '../models/FileMoveTracker';

export const yarnRoute = express.Router();

yarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        const ignoreFolder = req?.body?.ignoreFolder || "proc";

        console.log(`:downloadFromGoogleDrive:
        googleDriveLink:
         ${googleDriveLink?.split(",").map((link: string) => link + "\n ")} 
        profile ${profile}`)
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
            const res = await downloadFromGoogleDriveToProfile(link, profile, ignoreFolder);
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

yarnRoute.post('/downloadZipFromGoogleDrive', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        const ignoreFolder = req?.body?.ignoreFolder || "proc";

        console.log(`:downloadZipFromGoogleDrive:
        googleDriveLink:
         ${googleDriveLink?.split(",").map((link: string) => link + "\n ")} 
        profile ${profile}`)
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
            const res = await downloadFromGoogleDriveToProfile(link, profile, ignoreFolder, ZIP_TYPE);
            results.push(res);
        }
        const resultsSummary = results.map((res: any, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count} Wrong Size: ${res.dl_wrong_size_count}`;
        });
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download Zip Files from G-Drive: ${timeInfo(timeTaken)}`);

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

yarnRoute.post('/unzipAllFolders', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const folder = req?.body?.folder;
        const ignoreFolder = req?.body?.ignoreFolder || "proc";

        console.log(`:unzipAllFolders:
        folders to unzip:
         ${folder?.split(",").map((link: string) => link + "\n ")} 
        `)
        if (!folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "folder to unzip mandatory" 
                }
            });
        }
        const results = [];
        const _folder = folder.includes(",") ? folder.split(",").map((link: string) => link.trim()) : [folder.trim()];

        for (const link of _folder) {
            const res = await unzipAllFilesInDirectory(link, "", ignoreFolder);
            results.push(res);
        }

        const resultsSummary = results.map((res: {success_count:number,error_count:number}, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count}`;
        });
        
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to Unzip All Folders : ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            resultsSummary,
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
})

yarnRoute.post('/qaToDestFileMover', async (req: any, resp: any) => {
    console.log(`qaToDestFileMover ${JSON.stringify(req.body)} `)
    try {
        const qaPath = req?.body?.qaPath;
        const dest = req?.body?.dest || "";
        const flatten = req?.body?.flatten === "false" ? false : true;
        const ignorePaths = ["dont"];

        console.log(`qaToDestFileMover qaPath ${qaPath} for folder(${dest})`)
        if (!qaPath && !dest) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Src and Dest Items"
                }
            });
        }
        const listingResult = await moveFileSrcToDest(qaPath, dest, flatten, ignorePaths);
        resp.status(200).send({
            response: {
                ...listingResult
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnRoute.post('/yarnMoveProfilesToFreeze', async (req: any, resp: any) => {
    console.log(`moveProfilesToFreeze ${JSON.stringify(req.body)} `)
    try {
        const profileAsCSV = req?.body?.profileAsCSV;
        const ignorePaths = req.body?.ignorePaths || ["dont"];
        const flatten = req?.body?.flatten === "false" ? false : true;
        if (!profileAsCSV) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Profile"
                }
            });
        }
        const _response = await moveProfilesToFreeze(profileAsCSV, flatten, ignorePaths);
        resp.status(200).send(_response);
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnRoute.post('/yarnMoveFilesInListToFreeze', async (req: any, resp: any) => {
    console.log(`moveProfilesToFreeze ${JSON.stringify(req.body)} `)
    try {
        const _uploadCycleId = req.body.uploadCycleId;

        if (!_uploadCycleId) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide  UploadCycleId"
                }
            });
        }
        const _response = await moveItemsInListOfProfileToFreeze(_uploadCycleId);
        if (_uploadCycleId) {
            await markUploadCycleAsMovedToFreeze(_uploadCycleId)
        }
        for (const res of _response) {
            console.log(`Saving FileMoveTracker ${JSON.stringify(res)}`)    
            const tracker = new FileMoveTracker({
                uploadCycleId: res._uploadCycleId,
                ...res
            });
            await tracker.save()
        }
        resp.status(200).send({
            response: _response
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/addHeaderFooter', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;

        if (!profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide profile. it is mandatory"
                }
            });
        }
        const pdfDumpFolder = getFolderInSrcRootForProfile(profile)

        resp.status(200).send({
            response: {
                msg: `Request Recieved.Header / Footer will be added in few minutes`,
                "success": true,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnRoute.post('/vanitizePdfs', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;
        if (!profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "profile is mandatory"
                }
            });
        }
        const res = await vanitizePdfForProfiles(profile) || {
            "status": "failed",
            "message": "vanitizePdfForProfiles returned null"
        };
        console.log(`vanitizePdfs ${profile} res ${JSON.stringify(res)}`)
        resp.status(200).send({
            response: res
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/compareDirectories', async (req: any, resp: any) => {
    try {
        const srcDir = req.body.srcDir
        const destDir = req.body.destDir
        console.log(`/ compareDirectories srcDir ${srcDir} destDir ${destDir} `)
        if (!srcDir || !destDir) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "srcDir and destDir are mandatory"
                }
            });
        }

        let timeNow = Date.now();
        const res = await compareFolders(srcDir, destDir);
        resp.status(200).send({
            response: {
                timeTaken: timeInfo(Date.now() - timeNow),
                ...res
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})
