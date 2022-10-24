import * as express from 'express';
import { ItemsQueued } from '../models/itemsQueued';
import * as mongoose from 'mongoose';
import { getListOfItemsQueued, getListOfItemsQueuedArrangedByProfile } from '../services/dbService';
import { launchUploader } from '../services/gradleLauncherService';

export const itemsQueuedRoute = express.Router()

/**
 * INSOMNIA POST Request Sample
POST http://127.0.0.1/itemsQueued/add 
JSON Body 
 {
	"uploadCycleId": "2",
	"title": "2",
	"localPath": "2",
	"archiveProfile": "2",
	"datetimeUploadStarted": "12/12/2002 12:12:21",
	"csvName": "2",
	"uploadLink":"333"
}
 */
itemsQueuedRoute.post('/add', async (req:any, resp:any) => {
    try {
        console.log("req.body")
        const iq = new ItemsQueued(req.body);
        await iq.save();
        resp.status(200).send(iq);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/list', async (req:any, resp:any) => {
    try {
        const items = await getListOfItemsQueued(getLimit(resp));
        console.log(`after`)
        resp.status(200).send(items);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/listByProfile', async (req:any, resp:any) => {
    try {
        const groupedItems = await getListOfItemsQueuedArrangedByProfile(getLimit(resp));
        resp.status(200).send(groupedItems);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

function getLimit(res:any){
    const limit = res?.query?.limit || "100"
    console.log(`req.query ${JSON.stringify(res.query)} ${limit}`);
    return parseInt(limit);
}
