import * as fs from 'fs';
import * as path from 'path';
import moment from 'moment';
import * as fsExtra from "fs-extra";
import { DD_MM_YYYY_FORMAT } from '../utils/utils';
import { FileStats } from 'imgToPdf/utils/types';
import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';
import * as _ from 'lodash';
import { createFolderIfNotExistsAsync } from '../utils/FileUtils';
/**
 * 
 * @param folderName 
 * @param dateString must be DD-MMM-YYYY. Ex: 21-Mar-2021
 * if dateString === "ALL" then all files will be processed
 */
export function filesOnGivenDate(folderName: string, dateString: string = ""): string[] {
  let processableFiles: string[] = []
  const formattedDate = dateString != "ALL" ? (dateString || (moment(new Date())).format('DD-MMM-YYYY')) : "ALL";
  console.log(`\nSearching for Files in ${folderName} for ${formattedDate}`);

  const _files = fs.readdirSync(path.resolve("/", folderName))
  _files.forEach(file => {
    if (dateString === "ALL") {
      processableFiles.push(`${folderName}/${file}`);
    }
    else if (file.indexOf(formattedDate) > 0) {
      processableFiles.push(`${folderName}/${file}`);
    }
  });

  console.log(`We will process following ${processableFiles?.length} Files:`);

  processableFiles.forEach((fileName) => {
    //console.log(`${fileName}`);
  })
  return processableFiles;
}

export const generateCsvDirAndName = async (infix: string) => {
  const CSVS_DIR = ".//_csvs";
  await fsExtra.emptyDir(CSVS_DIR);
  await createFolderIfNotExistsAsync(CSVS_DIR);
  console.log(`CSVs Directory Created: ${CSVS_DIR}`);
  const csvFileName = `${CSVS_DIR}//eGangotri-${infix}-DailyWorkReport${moment(new Date()).format(DD_MM_YYYY_FORMAT)}.csv`;
  return csvFileName;
};

export function stripQuotes(text: any) {
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

export const addSummaryToExcel = (fileStats: FileStats[], totalFileCount: number, totalPageCount: number, totalSizeRaw: number) => {
  fileStats.push({
    size: "",
    absPath: "",
    folder: "",
    fileName: ""
  });
  fileStats.push({
    pageCount: totalPageCount,
    rawSize: totalSizeRaw,
    size: sizeInfo(totalSizeRaw),
    absPath: "",
    folder: "",
    fileName: ""
  })

  fileStats.push({
    rowCounter: "PDF Stats:",
    fileName: "",
    absPath: "",
    folder: "",
  });

  fileStats.push({
    rowCounter: "Total File Count:",
    absPath: "",
    folder: "",
    fileName: totalFileCount?.toString()
  });

  fileStats.push({
    rowCounter: "Total Size of Files Raw:",
    absPath: "",
    folder: "",
    fileName: totalSizeRaw?.toString()
  });

  fileStats.push({
    rowCounter: "Total Size of Files in Units:",
    absPath: "",
    folder: "",
    fileName: sizeInfo(totalSizeRaw)
  });

  fileStats.push({
    rowCounter: "Total Pages:",
    absPath: "",
    folder: "",
    fileName: totalPageCount?.toString()
  });
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


export const createMetadata = (fileStats: Array<FileStats>) => {
  const totalFileCount = fileStats.length;
  const totalPageCount = _.sum(fileStats.map(x => x.pageCount));
  const totalSizeRaw = _.sum(fileStats.map(x => x.rawSize));
  return { totalFileCount, totalPageCount, totalSizeRaw }
}
