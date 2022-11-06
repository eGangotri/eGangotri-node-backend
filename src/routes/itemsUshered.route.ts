const express = require("express");
import { ItemsUshered } from '../models/itemsUshered';
import { getListOfItemsUshered } from "../services/dbService";
import { Request, Response } from 'express';

/**
 * INSOMNIA POST Request Sample
POST http://localhost/itemsUshered/add 
JSON Body 
 {
	"uploadCycleId": "2",
	"title": "2",
	"localPath": "2",
	"archiveProfile": "2",
	"datetimeUploadStarted": "12/12/2002 12:12:21",
	"csvName": "2",
	"uploadLink":"333",
    "archiveItemId":"qwerThe"
}
 */
export const itemsUsheredRoute = express.Router()

itemsUsheredRoute.post('/add', async (req:any, resp:any) => {
    try {
        console.log("req.body")
        const iq = new ItemsUshered(req.body);
        await iq.save();
        resp.status(200).send(iq);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsUsheredRoute.get('/list', async (req:Request, resp:Response) => {
    try {
        const items = await getListOfItemsUshered(req?.query);
        console.log(`after getListOfItemsUshered`)
        resp.status(200).send({
            "response":items
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

