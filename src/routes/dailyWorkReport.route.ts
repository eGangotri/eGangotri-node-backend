const express = require("express");
import { DailyWorkReport } from "../models/dailyWorkReport";
import { CSV_HEADER_API2, generateCSV, getListOfDailyWorkReport } from "../services/dailyWorkReportService";
import { Request, Response } from "express";
import { validateUserFromRequest } from "./utils";
import { createObjectCsvWriter } from "csv-writer";
import { createReadStream } from "fs";
import moment from 'moment';
import mongoose from "mongoose";
import { DD_MM_YYYY_FORMAT } from "../utils/utils";

export const dailyWorkReportRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/dailyWorkReport/add 
JSON Body 
{
  "operatorName": "Aman",
  "password": "12228",
  "center": "Varanasi",
  "lib": "Tripathi",
  "totalPdfCount": 2,
  "totalPageCount": 500,
  "totalSize": "200 MB",
  "dateOfReport": "2023/04/15 12:12:21",
  "pageCountStats": [
    {
      "fileName": "ek.pdf",
      "pageCount": 300,
      "fileSize": "50 MB"
    },
    {
      "fileName": "do.pdf",
      "pageCount": 200,
      "fileSize": "150 MB"
    }
  ]
}
 */

dailyWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const user = req.body.operatorName

    if (await validateUserFromRequest(req)) {
      const wr = new DailyWorkReport(req.body);
      console.log(`dailyWorkReportRoute /add ${JSON.stringify(wr)}`);
      await wr.save();
      resp.status(200).send({
        "success": `Added Daily Report Stats with Id ${wr._id} for ${user}`
      });
    }
    else {
      resp.status(200).send({ error: `Couldn't validate User ${user}` });
    }
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyWorkReportRoute.get("/list", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retirieved item count: ${items.length}`
    );
    resp.status(200).send({
      response: items,
    });
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyWorkReportRoute.get("/csv", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retirieved item count: ${items.length}`
    );
    const _csv = generateCSV(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyWorkReportRoute.get("/csvAsFile", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retirieved item count: ${items.length}`
    );
    
    generateCSVAsFile(resp,items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

export const generateCSVAsFile = async (res: Response, data: mongoose.Document[] ) => {
  const csvFileName = `eGangotri-Staff-DWR-On-${moment(new Date()).format(DD_MM_YYYY_FORMAT)}.csv`
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

dailyWorkReportRoute.get("/detailedCsv", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);

    console.log(
      `after getListOfDailyWorkReport retirieved item count: ${items.length}`
    );
    const _detailedCSV = generateCSV(items)
    resp.status(200).send(_detailedCSV);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});
