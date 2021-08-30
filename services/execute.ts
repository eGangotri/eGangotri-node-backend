import * as connection from '../db/connection';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as _ from 'underscore';
import { ItemsQueued } from '../models/itemsQueued';
import { v4 as uuidv4 } from 'uuid';
import { addItemsBulk } from './dbService';
import { ItemsUshered } from '../models/itemsUshered';
import { DOC_TYPE } from '../common';


export async function processCSV(csvFileName: string, uploadCycleId: string, docType: DOC_TYPE = DOC_TYPE.IQ) {
    if(!csvFileName.endsWith('.csv')){
        csvFileName = csvFileName + '.csv';
    }
    //console.log(`reading ${csvFileName}`);
    let itemsArray = []

    const fileModifiedDate:Date = fs.statSync(csvFileName).mtime;

    fs.createReadStream(csvFileName)
        .pipe(csv())
        .on('data', async (row) => {
            itemsArray.push(await extractData(row, uploadCycleId, csvFileName, docType,fileModifiedDate));
        })
        .on('end', async () => {
            const response = await addItemsBulk(itemsArray, docType);
            //console.log(`finished reading ${csvFileName}`);
            return response;
        });
}

export async function processCSVPair(_queuedCSV: string, _usheredCSV: string) {
    const uploadCycleId = uuidv4();
    processCSV(_queuedCSV, uploadCycleId, DOC_TYPE.IQ);
    processCSV(_usheredCSV, uploadCycleId, DOC_TYPE.IU);
}

export async function extractData(row, uploadCycleId, csvFileName, docType: DOC_TYPE = DOC_TYPE.IQ, fileModifiedDate:Date) {
    return docType === DOC_TYPE.IQ ? await extractDataForItemsQueued(row, uploadCycleId, csvFileName, fileModifiedDate) : await extractDataForItemsUshered(row, uploadCycleId, csvFileName, fileModifiedDate);
}

export async function extractDataForItemsQueued(row: any, uploadCycleId: string, csvFileName: string, fileModifiedDate:Date) {
    const rowArray = _.values(row);
    //console.log('extractDataForItemsQueued: ' + rowArray[0]);
    return new ItemsQueued(
        {
            archiveProfile: rowArray[0],
            uploadLink: rowArray[1],
            localPath: rowArray[2],
            title: rowArray[3],
            csvName: csvFileName,
            uploadCycleId,
            datetimeUploadStarted:fileModifiedDate
        }
    );
}

export async function extractDataForItemsUshered(row: any, uploadCycleId: string, csvFileName: string, fileModifiedDate:Date) {
    const rowArray = _.values(row);
    //console.log('extractDataForItemsUshered:' + rowArray[3] + ' ::: ' + rowArray[4]);
    const itemUsheredObj = {
        archiveProfile: rowArray[0],
        uploadLink: rowArray[1],
        localPath: rowArray[2],
        title: rowArray[3],
        archiveItemId: rowArray[4],
        csvName: csvFileName,
        uploadCycleId,
        datetimeUploadStarted:fileModifiedDate
    }
    //console.log('extractDataForItemsUshered:' + JSON.stringify(itemUsheredObj));
    return new ItemsUshered(itemUsheredObj);
}
