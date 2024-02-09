import Csv from "@csv-js/csv";
import {
  DailyWorkReportType,
} from "../types/dailyyWorkReportTypes";
import { CAT_CSV_HEADER, CSV_HEADER, CSV_HEADER_API2, dailyDetailReportHeader } from "./constants";
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import * as _ from 'lodash';
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from "../utils/utils";

import mongoose from "mongoose";
import { DailyCatalogWorkReportType } from "../mirror/catalogWorkReportTypes";

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
          workFromHome:dailyWorkReport.workFromHome
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
        workFromHome:""
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
        workFromHome: dailyWorkReport.workFromHome,
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
      workFromHome:""
    },
    );
    console.log(`csvData ${JSON.stringify(csvData)}`)
    return csvData;
  };
  
  
export const generateCatWorkReportCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(CAT_CSV_HEADER, { name: "Cat Daily Work Report" });

  let entryCountSum = 0;

  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyCatalogWorkReportType;

    const formattedDate = moment(dailyWorkReport.timeOfRequest).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    entryCountSum += dailyWorkReport.entryCount;
    csv.append([
      {
        timeOfRequest: formattedDate,
        operatorName: dailyWorkReport.operatorName,
        catalogProfile: dailyWorkReport.catalogProfile,
        entryFrom: dailyWorkReport.entryFrom,
        entryTo: dailyWorkReport.entryTo,
        skipped: dailyWorkReport.skipped,
        entryCount: dailyWorkReport.entryCount,
        link: dailyWorkReport.link,
        notes: dailyWorkReport.notes
      },
    ]);
  });

  csv.append([
    {
      dateOfReport: "",
      operatorName: "",
      center: "",
      lib: "",
      entryCountSum: entryCountSum,
    },
  ]);

  const _csv = csv.toString();
  console.log(`_csv \n${_csv}`);
  return _csv;
};

export const generateQAWorkReportCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(CAT_CSV_HEADER, { name: "Cat Daily Work Report" });

  let entryCountSum = 0;

  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyCatalogWorkReportType;

    const formattedDate = moment(dailyWorkReport.timeOfRequest).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    entryCountSum += dailyWorkReport.entryCount;
    csv.append([
      {
        timeOfRequest: formattedDate,
        operatorName: dailyWorkReport.operatorName,
        catalogProfile: dailyWorkReport.catalogProfile,
        entryFrom: dailyWorkReport.entryFrom,
        entryTo: dailyWorkReport.entryTo,
        skipped: dailyWorkReport.skipped,
        entryCount: dailyWorkReport.entryCount,
        link: dailyWorkReport.link,
        notes: dailyWorkReport.notes
      },
    ]);
  });

  csv.append([
    {
      dateOfReport: "",
      operatorName: "",
      center: "",
      lib: "",
      entryCountSum: entryCountSum,
    },
  ]);

  const _csv = csv.toString();
  console.log(`_csv \n${_csv}`);
  return _csv;
};

export const generateCatWorkReportCSVApi2 = (reports: mongoose.Document[]) => {
  const csvData: any[] = [];
  let entryCountSum = 0;
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyCatalogWorkReportType;
    entryCountSum += parseInt(dailyWorkReport.entryCount.toString());
    const formattedDate = moment(dailyWorkReport.timeOfRequest).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    csvData.push({
      dateOfReport: formattedDate,
      operatorName: dailyWorkReport.operatorName,
      catalogProfile: dailyWorkReport.catalogProfile,
      entryFrom: dailyWorkReport.entryFrom,
      entryTo: dailyWorkReport.entryTo,
      skipped: dailyWorkReport.skipped,
      entryCount: dailyWorkReport.entryCount,
      link: dailyWorkReport.link,
      notes: dailyWorkReport.notes,
    },
    );
  });

  csvData.push({
    timeOfRequest: "",
    operatorName: "",
    catalogProfile: "",
    entryFrom: "",
    entryTo: "",
    entryCountSum: entryCountSum,
  },
  );
  console.log(`csvData ${JSON.stringify(csvData)}`)
  return csvData;
};


export const generateQAWorkReportCSVApi2 = (reports: mongoose.Document[]) => {
  const csvData: any[] = [];
  let entryCountSum = 0;
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(
      JSON.stringify(report.toJSON())
    ) as DailyCatalogWorkReportType;
    entryCountSum += parseInt(dailyWorkReport.entryCount.toString());
    const formattedDate = moment(dailyWorkReport.timeOfRequest).format(DD_MM_YYYY_FORMAT);
    console.log(formattedDate);
    csvData.push({
      dateOfReport: formattedDate,
      operatorName: dailyWorkReport.operatorName,
      catalogProfile: dailyWorkReport.catalogProfile,
      entryFrom: dailyWorkReport.entryFrom,
      entryTo: dailyWorkReport.entryTo,
      skipped: dailyWorkReport.skipped,
      entryCount: dailyWorkReport.entryCount,
      link: dailyWorkReport.link,
      notes: dailyWorkReport.notes,
    },
    );
  });

  csvData.push({
    timeOfRequest: "",
    operatorName: "",
    catalogProfile: "",
    entryFrom: "",
    entryTo: "",
    entryCountSum: entryCountSum,
  },
  );
  console.log(`csvData ${JSON.stringify(csvData)}`)
  return csvData;
};
