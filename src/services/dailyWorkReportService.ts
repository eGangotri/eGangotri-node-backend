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
import { DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH } from "../utils/constants";
import { subDays } from "date-fns";
import { getLimit } from "../routes/utils";

import {  Response } from "express";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import * as fsExtra from "fs-extra";
import * as fs from "fs";
import { CSV_HEADER, CSV_HEADER_API2, dailyDetailReportHeader } from "./constants";


export const generateCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(CSV_HEADER, { name: "Daily Work Report" });
 
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyWorkReportType;

    const formattedDate = moment(dailyWorkReport.dateOfReport).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    csv.append([
      {
        dateOfReport: formattedDate,
        operatorName: dailyWorkReport.operatorName,
        center: dailyWorkReport.center,
        lib: dailyWorkReport.lib,
        totalPdfCount: dailyWorkReport.totalPdfCount,
        totalPageCount: dailyWorkReport.totalPageCount,
        totalSize: dailyWorkReport.totalSize,
      },
    ]);
  });

  const _csv = csv.toString();
  console.log(`_csv \n${_csv}`);
  return _csv;
};

export const generateCSVApi2 = (reports: mongoose.Document[]) => {
  //const csv = new Csv(CSV_HEADER, { name: "Daily Work Report" });
  const csvData:any[] = [];
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyWorkReportType;

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

  return csvData;
};

export const generateDetailedCSV = (reports: mongoose.Document[]) => {
  const dailyDetailCSV = new Csv(dailyDetailReportHeader, {
    name: "Daily Work Report - Detailed",
  });
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyWorkReportType;

    const formattedDate = moment(dailyWorkReport.dateOfReport).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    const stats = dailyWorkReport.pageCountStats;
    stats.forEach((stat: PageCountStatsType) => {
      dailyDetailCSV.append([
        {
          operatorName: dailyWorkReport.operatorName,
          fileName: stat.fileName,
          pageCount: stat.pageCount,
          fileSize: stat.fileSize,
        },
      ]);
      //console.log(`stat ${JSON.stringify(stat)}`)
    });
  });

  const _dailyDetailCSV = dailyDetailCSV.toString();
  return _dailyDetailCSV;
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

  if (queryOptions?.operatorName){
    const operatorName:string[] = queryOptions?.operatorName.split(",")
    //This wil make the username case-independent
    var regexArray = operatorName.map(pattern => new RegExp(pattern, 'i'));
    mongoOptionsFilter = {...mongoOptionsFilter, operatorName: { $in: regexArray } };
    console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  }
  const limit: number = getLimit(queryOptions?.limit);
  console.log(` queryOptions ${JSON.stringify(queryOptions)} : mongoOptionsFilter: ${JSON.stringify(mongoOptionsFilter)}`)

  return {limit, mongoOptionsFilter};
}

export async function getListOfDailyWorkReport(queryOptions: ItemsListOptionsType) {
  const {limit,mongoOptionsFilter} = setOptionsForDailyWorkReportListing(queryOptions)

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

    // Write the data array to a CSV file
    await csvWriter.writeRecords(data);

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
