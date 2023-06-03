import Csv from "@csv-js/csv";
import {
  DailyWorkReportType,
  PageCountStatsType,
} from "../types/dailyyWorkReportTypes";
import mongoose from "mongoose";
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from "../utils/utils";
import { DailyWorkReport } from "../models/dailyWorkReport";
import { DailyWorkReportListOptionsType, ItemsListOptionsType } from "./types";
import { getLimit } from "../routes/utils";

import { Response } from "express";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import * as fsExtra from "fs-extra";
import * as fs from "fs";
import { CSV_HEADER, CSV_HEADER_API2, dailyDetailReportHeader } from "./constants";
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import * as _ from 'lodash';

export const generateCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(CSV_HEADER, { name: "Daily Work Report" });

  let pdfCountSum = 0;
  let pageCountSum = 0;
  let sizeRawSum = 0;

  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyWorkReportType;

    const formattedDate = moment(dailyWorkReport.dateOfReport).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    pdfCountSum += dailyWorkReport.totalPdfCount;
    pageCountSum += dailyWorkReport.totalPageCount;
    sizeRawSum += dailyWorkReport?.totalSizeRaw || 0;
    csv.append([
      {
        dateOfReport: formattedDate,
        operatorName: dailyWorkReport.operatorName,
        center: dailyWorkReport.center,
        lib: dailyWorkReport.lib,
        totalPdfCount: dailyWorkReport.totalPdfCount,
        totalPageCount: dailyWorkReport.totalPageCount,
        totalSize: dailyWorkReport.totalSize,
        totalSizeRaw: dailyWorkReport.totalSizeRaw,
      },
    ]);
  });

  csv.append([
    {
      dateOfReport: "",
      operatorName: "",
      center: "",
      lib: "",
      totalPdfCount: pdfCountSum,
      totalPageCount: pageCountSum,
      totalSize: Mirror.sizeInfo(sizeRawSum),
      totalSizeRaw: sizeRawSum,
    },
  ]);

  const _csv = csv.toString();
  console.log(`_csv \n${_csv}`);
  return _csv;
};

export const generateCSVApi2 = (reports: mongoose.Document[]) => {
  const csvData: any[] = [];
  let pdfCountSum = 0;
  let pageCountSum = 0;
  let sizeCountSum = 0;
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyWorkReportType;

    pdfCountSum += dailyWorkReport.totalPdfCount;
    pageCountSum += dailyWorkReport.totalPageCount;
    sizeCountSum += dailyWorkReport?.totalSizeRaw || 0;

    const formattedDate = moment(dailyWorkReport.dateOfReport).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    csvData.push({
      dateOfReport: formattedDate,
      operatorName: dailyWorkReport.operatorName,
      center: dailyWorkReport.center,
      lib: dailyWorkReport.lib,
      totalPdfCount: dailyWorkReport.totalPdfCount,
      totalPageCount: dailyWorkReport.totalPageCount,
      totalSize: dailyWorkReport.totalSize,
    },
    );
  });

  csvData.push({
    dateOfReport: "",
    operatorName: "",
    center: "",
    lib: "",
    totalPdfCount: pdfCountSum,
    totalPageCount: pageCountSum,
    totalSize: Mirror.sizeInfo(sizeCountSum),
  },
  );
  console.log(`csvData ${JSON.stringify(csvData)}`)
  return csvData;
};


export function setOptionsForDailyWorkReportListing(queryOptions: DailyWorkReportListOptionsType) {
  // Empty `filter` means "match all documents"
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate) {
    mongoOptionsFilter = {
      dateOfReport: {
        $gte: new Date(queryOptions?.startDate),
        $lte: new Date(queryOptions?.endDate),
      },
    };
  }
  //else {
  //   mongoOptionsFilter = { dateOfReport: { $gte: subDays(new Date(), DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH) } };
  // }

  if (queryOptions?.operatorName) {
    const operatorName: string[] = replaceQuotesAndSplit(queryOptions.operatorName)
    //This wil make the username case-independent
    var regexArray = operatorName.map(pattern => new RegExp(pattern, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, operatorName: { $in: regexArray } };
    console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  }

  if (queryOptions?.isLastTwoHours) {
    const isLastTwoHours = replaceQuotes(queryOptions.isLastTwoHours);
    if(isLastTwoHours  === 'true'){
      mongoOptionsFilter = {
        ...mongoOptionsFilter, 
        createdAt: {
          $gte: new Date(getDateTwoHoursBeforeNow()),
          $lte: new Date(new Date()),
        },
      };
    }
  }

  if (queryOptions?._id) {
    const _id:string[] = replaceQuotesAndSplit(queryOptions._id);
    mongoOptionsFilter = { ...mongoOptionsFilter, _id: { $in: _id } };

  }
  const limit: number = getLimit(queryOptions?.limit);
  console.log(` queryOptions ${JSON.stringify(queryOptions)} : mongoOptionsFilter: ${JSON.stringify(mongoOptionsFilter)}`)

  return { limit, mongoOptionsFilter };
}

const replaceQuotes = (replaceable:string) =>{
  return replaceable?.replace(/"|'/g, "")
}

const replaceQuotesAndSplit = (replaceable:string) =>{
  return replaceQuotes(replaceable).split(",");
}

function getDateTwoHoursBeforeNow(_date: Date = new Date()): Date {
    return new Date(_date.getTime() - (2 * 60 * 60 * 1000));
}

export async function getListOfDailyWorkReport(queryOptions: ItemsListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForDailyWorkReportListing(queryOptions)

  const items = await DailyWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}


export const generateCSVAsFile = async (res: Response, data: mongoose.Document[]) => {

  const CSVS_DIR = ".//_csvs"
  fsExtra.emptyDirSync(CSVS_DIR);
  ;
  if (!fs.existsSync(CSVS_DIR)) {
    console.log('creating: ', CSVS_DIR);
    fs.mkdirSync(CSVS_DIR)
  }

  const csvFileName = `${CSVS_DIR}//eGangotri-Staff-DWR-On-${moment(new Date()).format(DD_MM_YYYY_FORMAT)}.csv`
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_HEADER_API2
    });

    const pdfCountSum = _.sum(data.map(x=>x.get("totalPdfCount")))
    const pageCountSum = _.sum(data.map(x=>x.get("totalPageCount")));
    const sizeCountRawSum = _.sum(data.map(x=>x.get("totalSizeRaw")||0));


      console.log(`_toObj ${pdfCountSum} ${pageCountSum} ${sizeCountRawSum} ${Mirror.sizeInfo(sizeCountRawSum)}}`);
      await csvWriter.writeRecords(data); 
      await csvWriter.writeRecords([{
        dateOfReport: "Totals",
        operatorName: "",
        center: "",
        lib: "",
        totalPdfCount: pdfCountSum,
        totalPageCount: pageCountSum,
        totalSize: Mirror.sizeInfo(sizeCountRawSum),
        totalSizeRaw: sizeCountRawSum,
  }]); 

    // Set the response headers to indicate that the response is a CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${csvFileName}`);

    // Stream the CSV file as the response
    const fileStream = createReadStream(csvFileName);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error writing CSV:', error);
    res.status(500).send('Internal Server Error');
  }
}
