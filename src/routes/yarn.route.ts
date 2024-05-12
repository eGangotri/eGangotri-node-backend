import * as express from 'express';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { getFolderInSrcRootForProfile } from '../cliBased/utils';
import { moveFileSrcToDest, moveProfilesToFreeze, publishBookTitlesList } from '../services/yarnService';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { vanitizePdfForProfile } from '../vanityService/VanityPdf';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { compareFolders } from '../folderSync';

export const yarnRoute = express.Router();

yarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
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
            const res = await downloadPdfFromGoogleDriveToProfile(link, profile);
            results.push(res);
        }
        resp.status(200).send({
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/qaToDestFileMover', async (req: any, resp: any) => {
    console.log(`qaToDestFileMover ${JSON.stringify(req.body)}`)
    try {
        const qaPath = req?.body?.qaPath;
        const dest = req?.body?.dest || "";
        const flatten = req?.body?.flatten === "false" ? false : true;

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
        const listingResult = await moveFileSrcToDest(qaPath, dest, flatten);
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
    console.log(`moveProfilesToFreeze ${JSON.stringify(req.body)}`)
    try {
        const profileAsCSV = req?.body?.profileAsCSV;
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
        const _response = await moveProfilesToFreeze(profileAsCSV, flatten);
        resp.status(200).send(_response);
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
                msg: `Request Recieved. Header/Footer will be added in few minutes`,
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
        const res = await vanitizePdfForProfile(profile);
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
        console.log(`/compareDirectories srcDir ${srcDir} destDir ${destDir} `)
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