import Csv from "@csv-js/csv";
import {
  DailyWorkReportType,
} from "../types/dailyyWorkReportTypes";
import { CSV_HEADER, CSV_HEADER_API2, dailyDetailReportHeader } from "./constants";
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import * as _ from 'lodash';
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from "../utils/utils";

import mongoose from "mongoose";

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
  