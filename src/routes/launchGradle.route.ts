import * as express from 'express';
import { bookTitlesLaunchService, launchUploader, loginToArchive, moveToFreeze, reuploadMissed } from '../services/gradleLauncherService';
import { ArchiveProfileAndCount, ArchiveProfileAndTitle } from 'mirror/types';

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

launchGradleRoute.post('/reuploadMissed', async (req: any, resp: any) => {
    try {
        const itemsForReupload:ArchiveProfileAndTitle[] = req.body.itemsForReupload
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
        console.log(`bookTitles ${argFirst}`)
        const res = await bookTitlesLaunchService(argFirst)
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
