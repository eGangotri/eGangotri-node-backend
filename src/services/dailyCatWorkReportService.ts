import mongoose from "mongoose";
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from "../utils/utils";
import { DailyWorkReport } from "../models/dailyWorkReport";
import { DailyCatWorkReportListOptionsType, DailyWorkReportListOptionsType, ItemsListOptionsType } from "./types";
import { getLimit } from "../routes/utils";

import { Response } from "express";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import * as fsExtra from "fs-extra";
import * as fs from "fs";
import { CSV_CAT_HEADER_API2, CSV_HEADER_API2 } from "./constants";
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import * as _ from 'lodash';
import { getDateTwoHoursBeforeNow, replaceQuotes, replaceQuotesAndSplit } from "./Util";
import { DailyCatWorkReport } from "../models/dailyCatWorkReport";



export function setOptionsForDailyCatWorkReportListing(queryOptions: DailyCatWorkReportListOptionsType) {
  // Empty `filter` means "match all documents"
  // mongoOptionsFilter: {"dateOfReport":{"$gte":"2023-06-22T18:30:00.000Z","$lte":"2023-06-24T18:29:59.000Z"}}
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate && moment(queryOptions?.startDate).isValid() && moment(queryOptions?.endDate).isValid()) {
    const startDateWithTimeComponent = new Date(replaceQuotes(queryOptions?.startDate) + " 00:00:00");
    const endDateWithTimeComponent = new Date(replaceQuotes(queryOptions?.endDate) + " 23:59:59");
    console.log(`endDateWithTimeComponent ${endDateWithTimeComponent}  ${new Date()}`)
    mongoOptionsFilter = {
      createdAt: {
        $gte: startDateWithTimeComponent,
        $lte: endDateWithTimeComponent,
      },
    };
  }

  if (queryOptions?.operatorName) {
    const operatorName: string[] = replaceQuotesAndSplit(queryOptions.operatorName)
    //This wil make the username case-independent
    var regexArray = operatorName.map(pattern => new RegExp(pattern, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, operatorName: { $in: regexArray } };
  }


  if (queryOptions?.catalogProfile) {
    const centers: string[] = replaceQuotesAndSplit(queryOptions.catalogProfile)
    //This wil make the username case-independent
    var regexArray = centers.map(pattern => new RegExp(pattern, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, centcatalogProfileer: { $in: regexArray } };
  }

  if (queryOptions?._id) {
    const _id: string[] = replaceQuotesAndSplit(queryOptions._id);
    mongoOptionsFilter = { ...mongoOptionsFilter, _id: { $in: _id } };
  }
  if (queryOptions?.isLastTwoHours) {
    const isLastTwoHours = replaceQuotes(queryOptions.isLastTwoHours);
    if (isLastTwoHours === 'true') {
      mongoOptionsFilter = {
        ...mongoOptionsFilter,
        createdAt: {
          $gte: new Date(getDateTwoHoursBeforeNow()),
          $lte: new Date(new Date()),
        },
      };
    }
  }

  const limit: number = getLimit(queryOptions?.limit);
  console.log(`mongoOptionsFilter: ${JSON.stringify(mongoOptionsFilter)}`)
  console.log(`User dispatched queryOptions ${JSON.stringify(queryOptions)}`)
  return { limit, mongoOptionsFilter };
}

export async function getListOfDailyCatWorkReport(queryOptions: DailyCatWorkReportListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForDailyCatWorkReportListing(queryOptions)

  const items = await DailyCatWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}


export const generateCatCSVAsFile = async (res: Response, data: mongoose.Document[]) => {
  const CSVS_DIR = ".//_csvs"
  fsExtra.emptyDirSync(CSVS_DIR);
  if (!fs.existsSync(CSVS_DIR)) {
    console.log('creating: ', CSVS_DIR);
    fs.mkdirSync(CSVS_DIR)
  }

  const csvFileName = `${CSVS_DIR}//eGangotri-Staff-Catalog-DWR-On-${moment(new Date()).format(DD_MM_YYYY_FORMAT)}.csv`
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_CAT_HEADER_API2
    });

    const entryCountSum:number = _.sum(data.map(x => parseInt(x.get("entryCount").toString())))

    console.log(`_toObj ${entryCountSum}`);
    await csvWriter.writeRecords(data);
    await csvWriter.writeRecords([{
      timeOfRequest: "Totals",
      catalogProfile: "",
      entryFrom: "",
      entryTo: "",
      entryCount: entryCountSum,
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


export const deleteRowsByIds = async (_itemIds: string[]) => {
  // Define your criteria for deletion
  const deleteCriteria = {
    _id: { $in: _itemIds }
  };
  // Delete the rows based on the criteria
  const res = await DailyCatWorkReport.deleteMany(deleteCriteria);
  console.log(`delete res ${JSON.stringify(res)}`)
  return res;
}