import * as express from 'express';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { scrapeArchive } from '../archiveDotOrg/archiveScraper';
import * as fs from 'fs';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
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
        const details = req?.body?.details;
        console.log(`archiveLink ${archiveLink} `)
        if (!archiveLink) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide archive Link are mandatory"
                }
            });
        }
        const scrapeResult = await scrapeArchive(archiveLink, true);
        resp.status(200).send({
            response: {
                ...scrapeResult,
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