import mongoose from "mongoose";
import { ObjectId } from 'mongodb';

import moment from 'moment';
import { DailyWorkReport } from "../models/dailyWorkReport";
import { DailyWorkReportListOptionsType, ItemsListOptionsType } from "./types";
import { getLimit } from "../routes/utils";

import { Response } from "express";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import { CSV_HEADER_API2, CSV_HEADER_API2_FOR_AGGREGATES, CSV_HEADER_THREE_FIELDS_ONLYAPI2 } from "./constants";
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import * as _ from 'lodash';
import { generateCsvDirAndName, getDateTwoHoursBeforeNow, replaceQuotes, replaceQuotesAndSplit } from "./Util";


export function setOptionsForDailyWorkReportListing(queryOptions: DailyWorkReportListOptionsType) {
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


  if (queryOptions?.centers) {
    const centers: string[] = replaceQuotesAndSplit(queryOptions.centers)
    //This wil make the centers case-independent
    var regexArray = centers.map(pattern => new RegExp(`^${pattern}$`, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, center: { $in: regexArray } };
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

export async function getListOfDailyWorkReport(queryOptions: ItemsListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForDailyWorkReportListing(queryOptions)

  const items = await DailyWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}



export const generateCSVAsFile = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = generateCsvDirAndName("ScanOpStaff");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_HEADER_API2
    });

    const pdfCountSum = _.sum(data.map(x => x.get("totalPdfCount")))
    const pageCountSum = _.sum(data.map(x => x.get("totalPageCount")));
    const sizeCountRawSum = _.sum(data.map(x => x.get("totalSizeRaw") || 0));

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


export const generateCSVAsFileOfAggregates = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = generateCsvDirAndName("ScanOpStaff-Aggr");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_HEADER_API2_FOR_AGGREGATES
    });

    const grouped_data = _.groupBy(data, (doc) => {
      return _.capitalize(doc.get("operatorName").toString().toLowerCase())
    });

    const refinedData: Array<any> = []
    for (let [key, value] of Object.entries(grouped_data)) {
      const numOfEntries = value.length;

      const _centers = new Set<string>(value.map(x => x.get("center")));
      const centers = [..._centers].join(",")

      const _libs = new Set<string>(value.map(x => x.get("lib")));
      const libs = [..._libs].join(",")

      const _workFromHome = _.countBy((value.map(x => (x.get("workFromHome") || false).toString())));

      const _wFHPercentage = Math.floor(((_workFromHome["true"] || 0) * 100 / numOfEntries));

      const pdfCountSum = _.sum(value.map(x => x.get("totalPdfCount")))
      const pageCountSum = _.sum(value.map(x => x.get("totalPageCount")));
      const sizeCountRawSum = _.sum(value.map(x => x.get("totalSizeRaw") || 0));
      const averageByPages = Math.round(pageCountSum / numOfEntries)
      const averageByPdfs = Math.round(pdfCountSum / numOfEntries)

      const _row = {
        numEntries: numOfEntries,
        operatorName: key,
        center: centers,
        lib: libs,
        totalPdfCount: pdfCountSum,
        totalPageCount: pageCountSum,
        totalSize: Mirror.sizeInfo(sizeCountRawSum),
        totalSizeRaw: sizeCountRawSum,
        workFromHome: `${_wFHPercentage}%`,
        averageByPages,
        averageByPdfs
      }
      refinedData.push(_row)
    }

    await csvWriter.writeRecords(refinedData);
    const numEntriesSum = _.sum(refinedData.map(x => x["numEntries"] || 0));
    const totalPdfCountSum = _.sum(refinedData.map(x => x["totalPdfCount"] || 0));
    const totlaPageCountSum = _.sum(refinedData.map(x => x["totalPageCount"] || 0));
    const totalSizeRawSum = _.sum(refinedData.map(x => x["totalSizeRaw"] || 0));
    const averageByPagesSum: number = _.sum(refinedData.map(x => x["averageByPages"]))
    const averageByPdfsSum: number = _.sum(refinedData.map(x => x["averageByPdfs"]))

    await csvWriter.writeRecords([{
      numEntries: numEntriesSum,
      operatorName: "",
      center: "",
      lib: "",
      totalPdfCount: totalPdfCountSum,
      totalPageCount: totlaPageCountSum,
      totalSize: Mirror.sizeInfo(totalSizeRawSum),
      totalSizeRaw: totalSizeRawSum,
      workFromHome: "",
      averageByPages: averageByPagesSum,
      averageByPdfs: averageByPdfsSum
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

export const generateCsvAsFileOnlyOperatorAndPdfCount = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = generateCsvDirAndName("ScanOpStaff");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_HEADER_THREE_FIELDS_ONLYAPI2
    });

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

export const generateCsvAsFileOnlyOperatorAndPdfCountAggregate = async (res: Response, data: mongoose.Document[]) => {
  const csvFileName = generateCsvDirAndName("ScanOpStaffAgg");
  try {
    // Define the CSV file headers
    const csvWriter = createObjectCsvWriter({
      path: csvFileName,
      header: CSV_HEADER_THREE_FIELDS_ONLYAPI2
    });

    const grouped_data = _.groupBy(data, (doc) => {
      return _.capitalize(doc.get("operatorName").toString().toLowerCase())
    });
    const refinedData: Array<any> = []

    for (let [key, value] of Object.entries(grouped_data)) {
      const pdfCountSum = _.sum(value.map(x => x.get("totalPdfCount")))
      const pageCountSum = _.sum(value.map(x => x.get("totalPageCount")));
      const _row = {
        operatorName: key,
        totalPdfCount: pdfCountSum,
        totalPageCount: pageCountSum,
      }
      refinedData.push(_row)
    }

    await csvWriter.writeRecords(refinedData);
    const totalPdfCountSum = _.sum(refinedData.map(x => x["totalPdfCount"] || 0));
    const totlaPageCountSum = _.sum(refinedData.map(x => x["totalPageCount"] || 0));

    await csvWriter.writeRecords([{
      operatorName: "",
      totalPdfCount: totalPdfCountSum,
      totalPageCount: totlaPageCountSum,
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
  if (_itemIds?.length > 10) {
    return {
      message: "Deletion of more than 10 not allowed",
      deletedCount: 0
    }
  }
  console.log(`_itemIds ${JSON.stringify(_itemIds)}`)
  // Define your criteria for deletion
  const deleteCriteria = {
    _id: { $in: _itemIds.map(x => new ObjectId(x)) }
  };
  // Delete the rows based on the criteria
  try {
    const res = await DailyWorkReport.deleteOne(deleteCriteria);
    console.log(`delete res ${JSON.stringify(res)}`)
    return res;
  } catch (error) {
    console.error(error);
    return {
      message: error,
      deletedCount: 0
    }
  }

}