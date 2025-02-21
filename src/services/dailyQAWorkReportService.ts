import mongoose from "mongoose";
import moment from 'moment';
import { DailyQAWorkReportListOptionsType } from "../types/listingTypes";
import { getLimit } from "../routes/utils";

import { Response } from "express";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import * as fs from "fs";
import { CSV_CAT_HEADER_API2, CSV_CAT_HEADER_FOR_AGGREGATES_API2, CSV_CAT_HEADER_FOR_OPERATOR_NAME_AND_ENTRY_COUNT_API2, CSV_QA_HEADER_API2, CSV_QA_HEADER_FOR_AGGREGATES_API2 } from "./constants";
import * as _ from 'lodash';
import { generateCsvDirAndName, getDateTwoHoursBeforeNow, replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { DailyQAWorkReport } from "../models/dailyQAReport";



export function setOptionsForDailyQAWorkReportListing(queryOptions: DailyQAWorkReportListOptionsType) {
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
    //This wil make the operatorName case-independent
    var regexArray = operatorName.map(pattern => new RegExp(`^${pattern}$`, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, operatorName: { $in: regexArray } };
  }


  if (queryOptions?.catalogProfile) {
    const centers: string[] = replaceQuotesAndSplit(queryOptions.catalogProfile)
    //This wil make the username case-independent
    var regexArray = centers.map(pattern => new RegExp(`^${pattern}$`, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, centcatalogProfileer: { $in: regexArray } };
  }

  if (queryOptions?._ids) {
    const _id: string[] = replaceQuotesAndSplit(queryOptions._ids);
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

export async function getListOfDailyQAWorkReport(queryOptions: DailyQAWorkReportListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForDailyQAWorkReportListing(queryOptions)

  const items = await DailyQAWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}


export const generateQACSVAsFile = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = await generateCsvDirAndName("QA");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_QA_HEADER_API2
    });

    const pdfsRenamedCountSum: number = _.sum(data.map(x => parseInt(x.get("pdfsRenamedCount").toString())));
    const coverPagesRenamedCountSum: number = _.sum(data.map(x => parseInt(x.get("pdfsRenamedCount").toString())));

    console.log(`_toObj ${pdfsRenamedCountSum}`);
    await csvWriter.writeRecords(data);
    await csvWriter.writeRecords([{
      dateOfReport: "Totals",
      operatorName: data.length,
      notes: "",
      entryFrom: "",
      entryTo: "",
      folderNames: "",
      pdfsRenamedCount: pdfsRenamedCountSum,
      coverPagesRenamedCount: coverPagesRenamedCountSum,
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


export const generateQACSVAsFileOfAggregates = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = await generateCsvDirAndName("QAAggregates");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_QA_HEADER_FOR_AGGREGATES_API2
    });

    const grouped_data = _.groupBy(data, (doc) => {
      return _.capitalize(doc.get("operatorName").toString().toLowerCase())
    });

    console.log(`grouped_data ${JSON.stringify(grouped_data)}`);

    const refinedData: Array<any> = []
    for (let [key, value] of Object.entries(grouped_data)) {
      const numOfEntries = value.length;
      const pdfsRenamedCountSum = _.sum(value.map(x => parseInt(x.get("pdfsRenamedCount")) || 0));
      const coverPagesRenamedCountSum = _.sum(value.map(x => parseInt(x.get("coverPagesRenamedCount")) || 0));

      const averagePDfsRenamed = Math.round(pdfsRenamedCountSum / numOfEntries)
      const averageCPsRenamed = Math.round(coverPagesRenamedCountSum / numOfEntries)
      const _row = {
        numEntries: numOfEntries,
        operatorName: key,
        averagePDfsRenamed: averagePDfsRenamed,
        averageCPsRenamed: averageCPsRenamed,
      }
      refinedData.push(_row)
    }
    const entryCountSum: number = _.sum(refinedData.map(x => parseInt(x["entryCount"]?.toString())))
    const numEntriesSum: number = _.sum(refinedData.map(x => x["numEntries"]))
    const averagePDfsRenamedSum: number = _.sum(refinedData.map(x => x["averagePDfsRenamed"]))
    const averageCPsRenamedSum: number = _.sum(refinedData.map(x => x["averageCPsRenamedSum"]))

    console.log(`_toObj ${entryCountSum} numEntriesSum ${numEntriesSum}`);
    await csvWriter.writeRecords(refinedData);
    await csvWriter.writeRecords([{
      numEntries: numEntriesSum,
      operatorName: refinedData.length,
      entryCount: entryCountSum,
      averageCPsRenamedSum: averageCPsRenamedSum,
      averagePDfsRenamedSum: averagePDfsRenamedSum,
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
export const generateQACSVAsFileForOperatorAndEntryCountOnly = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = await generateCsvDirAndName("QA");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_CAT_HEADER_FOR_OPERATOR_NAME_AND_ENTRY_COUNT_API2
    });

    const entryCountSum: number = _.sum(data.map(x => parseInt(x.get("entryCount").toString())))

    console.log(`_toObj ${entryCountSum}`);
    await csvWriter.writeRecords(data);
    await csvWriter.writeRecords([{
      operatorName: data.length,
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
  const res = await DailyQAWorkReport.deleteMany(deleteCriteria);
  console.log(`delete res ${JSON.stringify(res)}`)
  return res;
}