import * as express from 'express';
import { launchUploader, launchUploaderViaAbsPath, launchUploaderViaExcel, loginToArchive, makeGradleCall, moveToFreeze, reuploadMissed } from '../services/gradleLauncherService';
import { ArchiveProfileAndTitle } from '../mirror/types';
import { isValidPath } from '../utils/utils';
import { getFolderInDestRootForProfile } from '../cliBased/utils';

export const launchGradleRoute = express.Router();

launchGradleRoute.get('/launchUploader', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`launchUploader ${_profiles}`)
        const res = await launchUploader(req.query.profiles)
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchGradleRoute.get('/launchUploaderViaExcel', async (req: any, resp: any) => {
    try {
        const gradleArgs = req.query.gradleArgs
        console.log(`launchUploaderViaExcel ${gradleArgs}`)
        const res = await launchUploaderViaExcel(req.query.gradleArgs)
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchGradleRoute.get('/launchUploaderViaAbsPath', async (req: any, resp: any) => {
    try {
        const gradleArgs = req.query.gradleArgs
        console.log(`launchUploaderViaAbsPath ${gradleArgs}`)
        const res = await launchUploaderViaAbsPath(gradleArgs)
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response:{
                success: false,
                message: err.message
            }
        });
    }
})


launchGradleRoute.post('/reuploadMissed', async (req: any, resp: any) => {
    try {
        const itemsForReupload: ArchiveProfileAndTitle[] = req.body.itemsForReupload
        const res = await reuploadMissed(itemsForReupload)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchGradleRoute.get('/moveToFreeze', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`moveToFreeze ${_profiles}`)
        const res = await moveToFreeze(req.query.profiles)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})


launchGradleRoute.get('/bookTitles', async (req: any, resp: any) => {
    try {
        const argFirst = req.query.argFirst
        const pdfsOnly = req.query.pdfsOnly

        const profileOrPaths = argFirst.includes(",") ? argFirst.split(",").map((link: string) => link.trim()) : [argFirst.trim()];
        console.log(`profileOrPaths ${profileOrPaths}`);

        const pdfDumpFolders = isValidPath(profileOrPaths[0]) ? profileOrPaths :
            profileOrPaths.map((_profileOrPath:string) => {
                return getFolderInDestRootForProfile(_profileOrPath)
            });

        console.log(`bookTitles ${pdfDumpFolders}`)
        const _cmd = `gradle bookTitles --args="paths='${pdfDumpFolders.join(",")}', pdfsOnly=${pdfsOnly}"`
        console.log(`_cmd ${_cmd}`)

        const res = await makeGradleCall(_cmd)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})

launchGradleRoute.get('/loginToArchive', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`loginToArchive ${_profiles}`)
        const res = await loginToArchive(req.query.profiles)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})
