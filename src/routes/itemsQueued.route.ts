const express = require("express");
import { ItemsQueued } from '../models/itemsQueued';
import { getListOfItemsQueued, getListOfItemsQueuedArrangedByProfile } from '../services/dbService';
import { getLimit } from './utils';
import { Request, Response } from 'express';

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
itemsQueuedRoute.post('/add', async (req:Request, resp:Response) => {
    try {
        console.log("req.body")
        const iq = new ItemsQueued(req.body);
        await iq.save();
        resp.status(200).send({
            "response":iq
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/list', async (req:Request, resp:Response) => {
    try {
        const items = await getListOfItemsQueued(getLimit(req));
        console.log(`after getListOfItemsQueued`)
        resp.status(200).send({
            "response":items
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/listByProfile', async (req:Request, resp:Response) => {
    try {
        const groupedItems = await getListOfItemsQueuedArrangedByProfile(getLimit(req));
        resp.status(200).send({
            "response":groupedItems
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
