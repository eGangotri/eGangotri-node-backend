import * as express from 'express';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { ARCHIVE_EXCEL_PATH, scrapeArchive } from '../archiveDotOrg/archiveScraper';
import * as fs from 'fs';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { getFolderInSrcRootForProfile } from '../cliBased/utils';
import { moveFileSrcToDest } from '../services/yarnService';
export const launchYarnRoute = express.Router();

launchYarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        console.log(`:googleDriveLink ${googleDriveLink} profile ${profile}`)
        if (!googleDriveLink || !profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }
        const results = [];
        if (googleDriveLink.includes(",")) {
            const links = googleDriveLink.split(",");
            const promises = links.map(link => downloadPdfFromGoogleDriveToProfile(link.trim(), profile));
            const allResults = await Promise.all(promises);
            results.push(...allResults);
        }
        else {
            const res = await downloadPdfFromGoogleDriveToProfile(googleDriveLink, profile);
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

launchYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLink = req?.body?.archiveLink;
        const onlyLinks = req?.body?.onlyLinks;

        if (!archiveLink) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide archive Link are mandatory"
                }
            });
        }
        scrapeArchive(archiveLink, onlyLinks);
        resp.status(200).send({
            response: {
                msg: `Request Recieved. Excel file will be created in folder ${ARCHIVE_EXCEL_PATH} in few minutes`,
                "success": true,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchYarnRoute.post('/getGoogleDriveListing', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListing ${JSON.stringify(req.body)}`)
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        console.log(`getGoogleDriveListing googleDriveLink ${googleDriveLink} `)
        if (!googleDriveLink) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide google drive Link"
                }
            });
        }
        const listingResult = await generateGoogleDriveListingExcel(googleDriveLink, folderName);
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

launchYarnRoute.post('/qaToDestFileMover', async (req: any, resp: any) => {
    console.log(`qaToDestFileMover ${JSON.stringify(req.body)}`)
    try {
        const qaPath = req?.body?.qaPath;
        const dest = req?.body?.dest || "";
        const profile = req?.body?.profile === "false" ? false : true;
        const flatten = req?.body?.flatten === "false" ? false : true;

        console.log(`qaToDestFileMover qaPath ${qaPath} `)
        if (!qaPath && !dest) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide google drive Link"
                }
            });
        }
        const listingResult = await moveFileSrcToDest(qaPath, dest, profile, flatten);
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

launchYarnRoute.post('/addHeaderFooter', async (req: any, resp: any) => {
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
                msg: `Request Recieved. Excel file will be created in folder ${ARCHIVE_EXCEL_PATH} in few minutes`,
                "success": true,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
