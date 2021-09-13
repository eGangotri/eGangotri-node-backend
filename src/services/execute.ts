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

    const fileCreateDate:Date = fs.statSync(csvFileName).birthtime;

    fs.createReadStream(csvFileName)
        .pipe(csv())
        .on('data', async (row) => {
            itemsArray.push(await extractData(row, uploadCycleId, csvFileName, docType,fileCreateDate));
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

export async function extractData(row, uploadCycleId, csvFileName, docType: DOC_TYPE = DOC_TYPE.IQ, fileCreateDate:Date) {
    return docType === DOC_TYPE.IQ ? await extractDataForItemsQueued(row, uploadCycleId, csvFileName, fileCreateDate) : await extractDataForItemsUshered(row, uploadCycleId, csvFileName, fileCreateDate);
}

export async function extractDataForItemsQueued(row: any, uploadCycleId: string, csvFileName: string, fileCreateDate:Date) {
    const rowArray = stripQuotesForItemsInArray(row);
    //console.log('extractDataForItemsQueued: ' + rowArray);
    return new ItemsQueued(
        {
            archiveProfile: rowArray[0],
            uploadLink: rowArray[1],
            localPath: rowArray[2],
            title: rowArray[3],
            csvName: csvFileName,
            uploadCycleId,
            datetimeUploadStarted:fileCreateDate
        }
    );
}

export async function extractDataForItemsUshered(row: any, uploadCycleId: string, csvFileName: string, fileCreateDate:Date) {
    const rowArray = stripQuotesForItemsInArray(row);
    //console.log('extractDataForItemsUshered:' + rowArray[3] + ' ::: ' + rowArray[4]);
    const itemUsheredObj = {
        archiveProfile: rowArray[0],
        uploadLink: rowArray[1],
        localPath: rowArray[2],
        title: rowArray[3],
        archiveItemId: rowArray[4],
        csvName: csvFileName,
        uploadCycleId,
        datetimeUploadStarted:fileCreateDate
    }
    //console.log('extractDataForItemsUshered:' + JSON.stringify(itemUsheredObj));
    return new ItemsUshered(itemUsheredObj);
}

function stripQuotes(text:any){
    const strippedValue = (typeof text === 'string') ? text.toString().replace(/\"/g,'').replace(/\"/g,'').trim(): text;
    //console.log(`stripQuotes ${JSON.stringify(text)} ${strippedValue}`);
    return strippedValue;
}

function stripQuotesForItemsInArray(rowArray:any[]){
    return _.values(rowArray).map((r:any)=> {return stripQuotes(r);});
}

