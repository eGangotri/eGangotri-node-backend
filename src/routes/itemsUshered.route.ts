const express = require("express");
import { ItemsUshered } from '../models/itemsUshered';
import { Request, Response } from 'express';
import { getListOfItemsUshered, getListOfUploadCyclesAndCorrespondingData, handleEachRow, itemsUsheredVerficationAndDBFlagUpdate, selectedItemsVerficationAndDBFlagUpdate } from '../services/itemsUsheredService';
import * as _ from 'lodash';
import { validateSuperAdminUserFromRequest } from '../services/userService';
import { ReuploadType } from '../types/listingTypes';
import { gradleLaunchArchiveUpload } from '../exec/exec';
import { ArchiveUploadExcelProps } from 'archiveDotOrg/archive.types';

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

itemsUsheredRoute.post('/add', async (req: any, resp: any) => {

    try {
        const _validate = await validateSuperAdminUserFromRequest(req);
        if (_validate[0]) {
            console.log("req.body:add")
            const iq = new ItemsUshered(req.body);
            await iq.save();
            resp.status(200).send(iq);
        }
        else {
            resp.status(200).send({ error: _validate[1] });
        }

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

/**
 * 	
 */
itemsUsheredRoute.post('/verifyUploadStatus', async (req: any, resp: any) => {
    try {
        const uploadCycleIdForVerification = req.body.uploadCycleIdForVerification;
        if (uploadCycleIdForVerification) {
            //get all Items_Ushered for uploadCycleIdForVerification
            const _res = await itemsUsheredVerficationAndDBFlagUpdate(uploadCycleIdForVerification);
            resp.status(200).send({
                response: _res
            });
        }
        else {
            const uploadsForVerification = req.body.uploadsForVerification;
            const results = await selectedItemsVerficationAndDBFlagUpdate(uploadsForVerification);
            resp.status(200).send({
                response: results,
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


itemsUsheredRoute.get('/list', async (req: Request, resp: Response) => {
    try {
        const items = await getListOfItemsUshered(req?.query);
        console.log(`after getListOfItemsUshered retirieved item count: ${items.length}`)
        resp.status(200).send({
            "response": items
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsUsheredRoute.get('/listForUploadCycle', async (req: Request, resp: Response) => {
    try {
        const uploadCycleIdAndData = await getListOfUploadCyclesAndCorrespondingData(req?.query)
        resp.status(200).send({
            "response": uploadCycleIdAndData
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsUsheredRoute.post('/reUploadMissedInUploadCycle', async (req: any, resp: any) => {
    try {
        const uploadCycleId = req.body.uploadCycleId;
        const itemsUnushered = await getListOfItemsUshered({
            uploadCycleId: uploadCycleId
        });

        let combinedExcel: ArchiveUploadExcelProps[] = []

        // itemsUnushered.forEach((item: ItemsUshered) => {
        //     combinedExcel.push({
        //         absPath: item.localPath,
        //         subject: item.uploadLink,
        //         description: `${matchingItem?.title || ""} ${firstExcel?.fileName || ""} ${matchingItem?.handlist || ""}, ${matchingItem?.material || ""}, ${matchingItem?.script || ""} ${matchingItem?.subject || ""}, FIP-EFEO`,
        //         creator: "FIP-EFEO-Pondicherry",
        //         title: matchingItem?.title
        //     });
        // }

        resp.status(200).send({ response: {"Not Implemented yet"} });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsUsheredRoute.post('/reUploadMissed', async (req: any, resp: any) => {
    try {
        const items = req.body;
        const itemsForReupload: ReuploadType[] = items.itemsForReupload;
        const res = gradleLaunchArchiveUpload(itemsForReupload);
        const first = itemsForReupload[0]

        const itemsByAcrhiveProfiles = _.groupBy(itemsForReupload, 'archiveProfile')
        console.log(`archiveProfiles:: ${JSON.stringify(itemsByAcrhiveProfiles)}`)
        // const command = 'gradle loginToArchive --args="SPS VT  PANINI"';
        // const command = 'gradle uploadToArchive --args="SPS VT  PANINI"';

        resp.status(200).send({ response: res });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
