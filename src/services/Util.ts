import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment';
import * as fsExtra from "fs-extra";
import { DD_MM_YYYY_FORMAT } from '../utils/utils';

/**
 * 
 * @param folderName 
 * @param dateString must be DD-MMM-YYYY. Ex: 21-Mar-2021
 * if dateString === "ALL" then all files will be processed
 */
 export function filesOnGivenDate(folderName:string, dateString:string = ""):string[]{
    let processableFiles:string[] = []
    const formattedDate = dateString != "ALL" ? (dateString || (moment(new Date())).format('DD-MMM-YYYY') ):"ALL";
    console.log(`\nSearching for Files in ${folderName} for ${formattedDate}`);
  
    fs.readdirSync(path.resolve("/", folderName)).forEach(file => {
      if(dateString === "ALL"){
        processableFiles.push(`${folderName}/${file}`);
      }
      else if (file.indexOf(formattedDate) > 0) {
        processableFiles.push(`${folderName}/${file}`);
      }
    });
  
    console.log(`We will process following ${processableFiles?.length} Files:`);
  
    processableFiles.forEach((fileName)=>{
      //console.log(`${fileName}`);
    })
    return processableFiles;
  }
  
  export const generateCsvDirAndName = (infix:string) => {
  
    const CSVS_DIR = ".//_csvs"
    fsExtra.emptyDirSync(CSVS_DIR);
    if (!fs.existsSync(CSVS_DIR)) {
      console.log('creating: ', CSVS_DIR);
      fs.mkdirSync(CSVS_DIR)
    }
  
    const csvFileName = `${CSVS_DIR}//eGangotri-${infix}-DailyWorkReport${moment(new Date()).format(DD_MM_YYYY_FORMAT)}.csv`
    return csvFileName;
  }
  

  function stripQuotes(text: any) {
    const strippedValue =
      typeof text === "string"
        ? text.toString().replace(/\"/g, "").replace(/\"/g, "").trim()
        : text;
    return strippedValue;
  }
  
  export function stripQuotesForItemsInArray(rowArray: Array<any>) {
    return rowArray.map((r: any) => {
      return stripQuotes(r);
    });
  }

  export function addSizeStrings() {
    
  }

  
export const replaceQuotes = (replaceable: string) => {
  console.log(`replaceable ${JSON.stringify(replaceable)}`)
  return replaceable?.replace(/"|'/g, "")
}

export const replaceQuotesAndSplit = (replaceable: string) => {
  return replaceQuotes(replaceable).split(",");
}

export function getDateTwoHoursBeforeNow(_date: Date = new Date()): Date {
  return new Date(_date.getTime() - (2 * 60 * 60 * 1000));
}