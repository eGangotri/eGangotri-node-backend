const express = require("express");
import { ItemsUshered } from '../models/itemsUshered';
import { Request, Response } from 'express';
import { getListOfItemsUshered, handleEachRow, itemsUsheredVerficationAndDBFlagUpdate, selectedItemsVerficationAndDBFlagUpdate } from '../services/itemsUsheredService';
import * as _ from 'lodash';
import { UploadCycleTableDataDictionary } from '../mirror/types';
import { validateSuperAdminUserFromRequest } from '../services/userService';
import { getListOfItemsQueued } from '../services/itemsQueuedService';
import { getListOfUploadCycles } from '../services/uploadCycleService';
import { ReuploadType } from '../services/types';
import { gradleLaunchArchiveUpload } from '../exec/exec';

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
        const _uploadsForVerification = req.body.uploadsForVerification;
        if (uploadCycleIdForVerification) {
            //get all Items_Ushered for uploadCycleIdForVerification
            const [results, archiveProfiles] = await itemsUsheredVerficationAndDBFlagUpdate(uploadCycleIdForVerification);

            resp.status(200).send({
                response: {
                    results,
                    status: `Verfification/DB-Marking of (${results.length}) items for  ${uploadCycleIdForVerification} ${archiveProfiles} completed.`
                }
            });
        }
        else {
            // const uploadsForVerification: SelectedUploadItem[] = _uploadsForVerification
            const results = await selectedItemsVerficationAndDBFlagUpdate(_uploadsForVerification);
            resp.status(200).send({
                response: results,
                status: `Verfification/DB-Marking of (${results.length}) items for SelectedItems completed.`
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
        const items = await getListOfItemsUshered(req?.query);
        const queuedItems = await getListOfItemsQueued(req?.query)
        const uploadCycles = await getListOfUploadCycles(req?.query)
        console.log(`req?.query: ${JSON.stringify(req?.query)}`)

        const groupedItems = _.groupBy(items, function (item: any) {
            return item.uploadCycleId;
        });

        const groupedQueuedItems = _.groupBy(queuedItems, function (item: any) {
            return item.uploadCycleId;
        });

        const groupedUploadCycles = _.groupBy(uploadCycles, function (item: any) {
            return item.uploadCycleId;
        });

        const uploadCycleIdAndData: UploadCycleTableDataDictionary[] = []
        for (const key in groupedItems) {
            const usheredRow = groupedItems[key]
            const queuedRow = groupedQueuedItems[key];
            const uploadCycleRow: any = groupedUploadCycles[key];

            const groupedByArchiveProfiles = _.groupBy(usheredRow, function (item: any) {
                return item.archiveProfile;
            });
            const queuedRowGroupedByArchiveProfiles = _.groupBy(queuedRow, function (item: any) {
                return item.archiveProfile;
            });

            const _cycle_and_profiles = handleEachRow(key, groupedByArchiveProfiles, queuedRowGroupedByArchiveProfiles, uploadCycleRow)

            uploadCycleIdAndData.push({
                uploadCycle: _cycle_and_profiles
            })
        }
        resp.status(200).send({
            "response": uploadCycleIdAndData
        });
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
