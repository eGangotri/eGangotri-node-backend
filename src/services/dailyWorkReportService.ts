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


export function setOptionsForDailyWorkReportListing(queryOptions: DailyWorkReportListOptionsType) {
  // Empty `filter` means "match all documents"
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate) {
    mongoOptionsFilter = {
      createdAt: {
        $gte: new Date(queryOptions?.startDate),
        $lte: new Date(queryOptions?.endDate),
      },
    };
  } else {
    mongoOptionsFilter = { createdAt: { $gte: subDays(new Date(), DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH) } };
  }

  if (queryOptions?.operatorName){
    const operatorName:string[] = queryOptions?.operatorName.split(",")
    //This wil make the username case-independent
    var regexArray = operatorName.map(pattern => new RegExp(pattern, 'i'));
    console.log(` queryOptions?.operatorName ${queryOptions?.operatorName} : regexArray: ${regexArray}`)
    mongoOptionsFilter = {...mongoOptionsFilter, operatorName: { $in: regexArray } };
    console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  }
  const limit: number = getLimit(queryOptions?.limit);
  return {limit, mongoOptionsFilter};
}

export async function getListOfDailyWorkReport(queryOptions: ItemsListOptionsType) {
  const {limit,mongoOptionsFilter} = setOptionsForDailyWorkReportListing(queryOptions)

  const items = await DailyWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}
