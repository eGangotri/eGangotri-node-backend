const express = require("express");
import { ItemsUshered } from '../models/itemsUshered';
import { Request, Response } from 'express';
import { getListOfItemsUshered } from '../services/itemsUsheredService';
import * as _ from 'lodash';
import { ArchiveProfileAndCount, SelectedUploadItem, UploadCycleTableData, UploadCycleTableDataDictionary, UploadCycleTableDataResponse } from '../mirror/types';
import { validateSuperAdminUserFromRequest } from '../services/userService';
import { checkUrlValidity } from '../utils/utils';
import { createArchiveLink } from '../mirror';
import { getListOfItemsQueued } from '../services/itemsQueuedService';

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
        const items = req.body;
        const uploadsForVerification: SelectedUploadItem[] = items.uploadsForVerification
        const results: SelectedUploadItem[] = [];

        for (const forVerification of uploadsForVerification) {
            const res = await checkUrlValidity(forVerification);
            results.push(res);
        }
        resp.status(200).send({ response: results });
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
        console.log(`req?.query: ${JSON.stringify(req?.query)}`)

        const groupedItems = _.groupBy(items, function (item: any) {
            return item.uploadCycleId;
        });

        const groupedQueuedItems = _.groupBy(queuedItems, function (item: any) {
            return item.uploadCycleId;
        });

        const uploadCycleIdAndData: UploadCycleTableDataDictionary[] = []
        for (const key in groupedItems) {
            const usheredRow = groupedItems[key]
            const queuedRow = groupedQueuedItems[key];
            console.log(`queuedRow ${JSON.stringify(queuedRow)}`)
            const groupedByArchiveProfiles = _.groupBy(usheredRow, function (item: any) {
                return item.archiveProfile;
            });
            const queuedRowGroupedByArchiveProfiles = _.groupBy(queuedRow, function (item: any) {
                return item.archiveProfile;
            });

            const _cycle_and_profiles = handleEachRow(key, groupedByArchiveProfiles,queuedRowGroupedByArchiveProfiles)

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

const handleEachRow = (uploadCycleId: string, 
    usheredRow: _.Dictionary<UploadCycleTableData[]>,
    queuedRow: _.Dictionary<UploadCycleTableData[]>) => {
    const archiveProfileAndCount: ArchiveProfileAndCount[] = []
    let totalCount = 0
    let dateTimeUploadStarted = new Date();
    for (const key in usheredRow) {
        const row = usheredRow[key]
        // console.log(`handleEachRow: ${key}: ${row}`);
        archiveProfileAndCount.push({
            archiveProfile: key,
            count: row.length
        })
        totalCount += row.length
        dateTimeUploadStarted = row[0]?.datetimeUploadStarted
    }

    const archiveProfileAndCountForQueue: ArchiveProfileAndCount[] = []
    let totalQueueCount = 0
    let dateTimeQueueUploadStarted = new Date();
    for (const key in queuedRow) {
        const row = queuedRow[key]
        // console.log(`handleEachRow: ${key}: ${row}`);
        archiveProfileAndCountForQueue.push({
            archiveProfile: key,
            count: row.length
        })
        totalQueueCount += row.length
        dateTimeQueueUploadStarted = row[0]?.datetimeUploadStarted
    }

    const uploadCycleData: UploadCycleTableData = {
        uploadCycleId,
        archiveProfileAndCount,
        datetimeUploadStarted: dateTimeUploadStarted,
        totalCount,
        archiveProfileAndCountForQueue,
        totalQueueCount,
        dateTimeQueueUploadStarted
    }

    return uploadCycleData
}