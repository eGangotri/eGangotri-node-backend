import Csv from "@csv-js/csv";
import {
  DailyWorkReportType,
  PageCountStatsType,
} from "../types/dailyyWorkReportTypes";
import mongoose from "mongoose";
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from "../utils/utils";

const header = [
  {
    key: "dateOfReport",
    label: "DATE",
  },
  {
    key: "operatorName",
    label: "NAME",
  },
  {
    key: "center",
    label: "Center",
  },
  {
    key: "lib",
    label: "Lib",
  },
  {
    key: "totalPdfCount",
    label: "TOTAL PDF COUNT",
  },
  {
    key: "totalPageCount",
    label: "TOTAL PAGE COUNT(Pages)",
  },
  {
    key: "totalSize",
    label: "TOTAL SIZE",
  },

  {
    key: "pageCountStats",
    label: "Operator Name",
  },
];

const dailyDetailReportHeader = [
  {
    key: "operatorName",
    label: "Operator Name",
  },
  {
    key: "fileName",
    label: "File Name",
  },
  {
    key: "pageCount",
    label: "PAGE COUNT(Pages)",
  },
  {
    key: "fileSize",
    label: "File Size",
  },
];

export const generateCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(header, { name: "Daily Work Report" });
 
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
  // Browser download csv
  //csv.download();
  return _csv;
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
