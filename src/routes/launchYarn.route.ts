import * as express from 'express';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';

export const launchYarnRoute = express.Router();

launchYarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        console.log(`googleDriveLink ${googleDriveLink} profile ${profile}`)
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

