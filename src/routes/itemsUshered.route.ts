const express = require("express");
import { ItemsUshered } from '../models/itemsUshered';
import { getListOfItemsUshered } from "../services/dbService";
import { Request, Response } from 'express';
import { validateSuperAdminUserFromRequest } from './utils';

/**
 * INSOMNIA POST Request Sample
POST http://localhost/itemsUshered/add 
JSON Body 
 {
    "superadmin_user": "XXXX",
	"superadmin_password": "XXXXX",
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
        const _validate = await validateSuperAdminUserFromRequest(req);
        if (_validate[0]) {
            console.log("req.body:add")
            const iq = new ItemsUshered(req.body);
            await iq.save();
            resp.status(200).send(iq);
          }
          else {
            resp.status(200).send({error:_validate[1]});
          }
       
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

/**
 * 	
  {
  "verifiableUploads": "645cf758fca4f605585473d1,645cf6fafca4f605585473c1"
  }

 */
itemsUsheredRoute.post('/verifyUploadStatus', async (req:any, resp:any) => {
    try {
        console.log("req.body:verifyUploadStatus")
        const items = req.body;
        console.log(`verifiableUploads ${items.verifiableUploads}`);
        const itemsUshered = await getListOfItemsUshered({ids:items?.verifiableUploads})
        resp.status(200).send(`We received :${itemsUshered}`);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


itemsUsheredRoute.get('/list', async (req:Request, resp:Response) => {
    try {
        const items = await getListOfItemsUshered(req?.query);
        console.log(`after getListOfItemsUshered retirieved item count: ${items.length}`)
        resp.status(200).send({
            "response":items
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

