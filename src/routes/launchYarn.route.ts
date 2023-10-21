import * as express from 'express';
import { launchUploader, loginToArchive, moveToFreeze } from '../services/gradleLauncherService';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';

export const launchYarnRoute = express.Router();

launchYarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    console.log(`googleDriveLink }`)

    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        console.log(`googleDriveLink ${googleDriveLink} profile ${profile}`)
        const res = await downloadPdfFromGoogleDriveToProfile(googleDriveLink, profile);
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

