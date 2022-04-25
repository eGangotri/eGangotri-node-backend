import fs from "fs";
var fsPromises = require("fs").promises;
const csv = require("csv-parse");

import * as _ from "underscore";
import { ItemsQueued } from "../models/itemsQueued";
import { v4 as uuidv4 } from "uuid";
import { addItemstoMongoBulk } from "./dbService";
import { ItemsUshered } from "../models/itemsUshered";
import { DOC_TYPE } from "../common";

export async function processCSV(
  csvFileName: string,
  uploadCycleId: string,
  docType: DOC_TYPE = DOC_TYPE.IQ
) {
  if (!csvFileName.endsWith(".csv")) {
    csvFileName = csvFileName + ".csv";
  }
  //console.log(`reading ${csvFileName}`);
  let itemsArray: any[] = [];

  const fileCreateDate: Date = fs.statSync(csvFileName).birthtime;

  const records: Array<string> = [];

  const allFileContents = fs.readFileSync(csvFileName, "utf-8");
  const splitLinesArray = allFileContents.split(/\r?\n/)
  for( let x = 0; x < splitLinesArray.length;x++){
      const line = splitLinesArray[x];
    if(line && line.trim() !== '') {
        records.push(line);
        const csv = line.split(',');
        console.log(`Line from file(${csvFileName}):
        ${csv[0]}\n ${csv[1]}\n ${csv[2]}\n ${csv[3]} \n ${csv[4]}<-`);
    
        const extractedData = await extractData(
            csv,
            uploadCycleId,
            csvFileName,
            docType,
            fileCreateDate
          );
          console.log(`extractedData ${extractedData}`);
          itemsArray.push(extractedData);
    }
  }
  
  try{
      const response = await addItemstoMongoBulk(itemsArray, docType);
        console.log(
            `finished reading ${csvFileName} and pushing extracted data (${itemsArray[0]})to DB with response ${response}`
        );
        return response;
  }
  catch(err){
      console.log(err);
      return null
  }
}

export async function processCSVPair(_queuedCSV: string, _usheredCSV: string) {
  const uploadCycleId = uuidv4();
  processCSV(_queuedCSV, uploadCycleId, DOC_TYPE.IQ);
  processCSV(_usheredCSV, uploadCycleId, DOC_TYPE.IU);
}

export async function extractData(
  row: Array<string>,
  uploadCycleId: string,
  csvFileName: string,
  docType: DOC_TYPE = DOC_TYPE.IQ,
  fileCreateDate: Date
) {
    
  

  return docType === DOC_TYPE.IQ
    ? await extractDataForItemsQueued(
        row,
        uploadCycleId,
        csvFileName,
        fileCreateDate
      )
    : await extractDataForItemsUshered(
        row,
        uploadCycleId,
        csvFileName,
        fileCreateDate
      );
}

export async function extractDataForItemsQueued(
  row: Array<any>,
  uploadCycleId: string,
  csvFileName: string,
  fileCreateDate: Date
) {
  const rowArray = stripQuotesForItemsInArray(row);
  return new ItemsQueued({
    archiveProfile: rowArray[0],
    uploadLink: rowArray[1],
    localPath: rowArray[2],
    title: rowArray[3],
    csvName: csvFileName,
    uploadCycleId,
    datetimeUploadStarted: fileCreateDate,
  });
}

export async function extractDataForItemsUshered(
  row: Array<any>,
  uploadCycleId: string,
  csvFileName: string,
  fileCreateDate: Date
) {
  const rowArray = stripQuotesForItemsInArray(row);
 
  const itemUsheredObj = {
    archiveProfile: rowArray[0],
    uploadLink: rowArray[1],
    localPath: rowArray[2],
    title: rowArray[3],
    archiveItemId: rowArray[4],
    csvName: csvFileName,
    uploadCycleId,
    datetimeUploadStarted: fileCreateDate,
  };
  //console.log('extractDataForItemsUshered:' + JSON.stringify(itemUsheredObj));
  return new ItemsUshered(itemUsheredObj);
}

function stripQuotes(text: any) {
  const strippedValue =
    typeof text === "string"
      ? text.toString().replace(/\"/g, "").replace(/\"/g, "").trim()
      : text;
  //console.log(`stripQuotes ${JSON.stringify(text)} ${strippedValue}`);
  return strippedValue;
}

function stripQuotesForItemsInArray(rowArray: Array<any>) {
  console.log(
    `stripQuotesForItemsInArray 1 \n${rowArray[0]} 2 \n${rowArray[1]} 3 \n${rowArray[2]}`
  );
  return rowArray.map((r: any) => {
    return stripQuotes(r);
  });
}
