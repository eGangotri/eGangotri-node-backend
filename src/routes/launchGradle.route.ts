import express from 'express';
import { ItemsQueued } from '../models/itemsQueued';
import * as mongoose from 'mongoose';
import { getListOfItemsQueued, getListOfItemsQueuedArrangedByProfile } from '../services/dbService';
import { launchUploader } from '../services/gradleLauncherService';

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