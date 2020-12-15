import * as connection from '../db/connection';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as _ from 'underscore';
import { ItemsQueued } from '../models/itemsQueued';
import { v4 as uuidv4 } from 'uuid';
import { addItemsBulk } from './dbService';
import { ItemsUshered } from '../models/itemsUshered';

let iqArray = []

export async function processCSV(csvFileName: string, uploadCycleId: string, docType: 'IQ' | 'IU' = 'IQ') {
    console.log(`reading ${csvFileName}`);
    fs.createReadStream(csvFileName)
        .pipe(csv())
        .on('data', async (row) => {
            iqArray.push(await extractData(row, uploadCycleId, csvFileName, docType));
        })
        .on('end', async () => {
            console.log('CSV file successfully processed');
            const response = await addItemsBulk(iqArray, docType);
            console.log(`finished reading ${csvFileName}`);
            return response;
        });
}

export async function processCSVPair(_queuedCSV: string, _usheredCSV: string) {
    const uploadCycleId = uuidv4();
    //processCSV(_queuedCSV, uploadCycleId, 'IQ');
    processCSV(_usheredCSV, uploadCycleId, 'IU');
}

export async function extractData(row, uploadCycleId, csvFileName, docType: 'IQ' | 'IU' = 'IQ') {
    return docType === 'IQ' ? await extractDataForItemsQueued(row, uploadCycleId, csvFileName) : await extractDataForItemsUshered(row, uploadCycleId, csvFileName);
}

export async function extractDataForItemsQueued(row: any, uploadCycleId: string, csvFileName: string) {
    const rowArray = _.values(row);
    console.log('extractDataForItemsQueued: ' + rowArray[0]);
    return new ItemsQueued(
        {
            archiveProfile: rowArray[0],
            uploadLink: rowArray[1],
            localPath: rowArray[2],
            title: rowArray[3],
            csvName: csvFileName,
            uploadCycleId
        }
    );
}

export async function extractDataForItemsUshered(row: any, uploadCycleId: string, csvFileName: string) {
    const rowArray = _.values(row);
    console.log('extractDataForItemsUshered:' + rowArray[3] + ' ::: ' + rowArray[4]);
    const itemUsheredObj = {
        archiveProfile: rowArray[0],
        uploadLink: rowArray[1],
        localPath: rowArray[2],
        title: rowArray[3],
        archiveItemId: rowArray[4],
        csvName: csvFileName,
        uploadCycleId
    }
    console.log('extractDataForItemsUshered:' + JSON.stringify(itemUsheredObj));
    return new ItemsUshered(itemUsheredObj);
}
