import * as express from 'express';
import { launchUploader, moveToFreeze } from '../services/gradleLauncherService';

export const launchGradleRoute =  express.Router();

launchGradleRoute.get('/', async (req:any, resp:any) => {
    try {
        launchUploader(req.query.profiles)
        resp.status(200).send("Success");
        
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchGradleRoute.get('/moveToFreeze', async (req:any, resp:any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`moveToFreeze ${_profiles}`)
        moveToFreeze(req.query.profiles)
        resp.status(200).send("Success");
        
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})