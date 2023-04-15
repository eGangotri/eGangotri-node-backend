import Csv from "@csv-js/csv";
import { DailyWorkReportType, PageCountStatsType } from "../types/dailyyWorkReportTypes";
import mongoose from "mongoose";

const header = [
  {
    key: "operatorName",
    label: "Operator Name",
  },
  {
    key: "totalPdfCount",
  },
  {
    key: "totalPageCount",
  },
  {
    key: "totalSize",
  },
  {
    key: "dateOfReport",
  },
  {
    key: "pageCountStats",
  },
];

const dailyDetailReportHeader = [
    {
      key: "operatorName",
      label: "Operator Name",
    },
    {
      key: "fileName",
    },
    {
      key: "pageCount",
    },
    {
      key: "fileSize",
    },
  ];
  

export const generateCSV = (reports: mongoose.Document[]) => {
  const csv = new Csv(header, { name: "Daily Work Report " });
  const dailyDetailCSV = new Csv(dailyDetailReportHeader, { name: "Daily Work Report " });
  reports.forEach((report: mongoose.Document) => {
    const dailyWorkReport = JSON.parse(JSON.stringify(report.toJSON())) as DailyWorkReportType
    csv.append([
      {
        operatorName: dailyWorkReport.operatorName,
        totalPdfCount: dailyWorkReport.totalPdfCount,
        totalPageCount: dailyWorkReport.totalPageCount,
        totalSize: dailyWorkReport.totalSize,
        dateOfReport: dailyWorkReport.dateOfReport,
      },
    ]);

    const stats = dailyWorkReport.pageCountStats
    stats.forEach( (stat:PageCountStatsType) => {
        
    dailyDetailCSV.append([
        {
          operatorName: dailyWorkReport.operatorName,
          fileName:stat.fileName,
          pageCount:stat.pageCount,
          fileSize:stat.fileSize,
        },
      ]);
    //console.log(`stat ${JSON.stringify(stat)}`)

    })
    //console.log(`item ${JSON.stringify(dailyWorkReport)}`)
  });

  const _csv = csv.toString(); 
  const _dailyDetailCSV = dailyDetailCSV.toString();
  console.log(`_csv \n${_csv}`);
  // Browser download csv
  //csv.download();
  return [_csv,_dailyDetailCSV]
};
