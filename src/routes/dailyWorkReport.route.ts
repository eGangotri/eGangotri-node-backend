const express = require("express");
import { DailyWorkReport } from "../models/dailyWorkReport";
import { ItemsUshered } from "../models/itemsUshered";
import { getListOfDailyWorkReport, getListOfItemsUshered } from "../services/dbService";
import { Request, Response } from "express";

/**
 * INSOMNIA POST Request Sample
POST http://localhost/dailyWorkReport/add 
JSON Body 
const x =    {
  "operatorName": "Aman",
  "totalPdfCount": 2,
  "totalPageCount": 500,
  "totalSize": "200 MB",
  "dateOfReport": "2023/04/15 12:12:21",
  "pageCountStats": [
    {
      "fileName": "ek.pdf",
      "pageCount": 300,
      "fileSize": "50 MB",
    },
    {
      "fileName": "do.pdf",
      "pageCount": 200,
      "fileSize": "150 MB",
    },
  ],
}
 */
export const dailyWorkReportRoute = express.Router();

dailyWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    console.log("req.body");
    const wr = new DailyWorkReport(req.body);
    await wr.save();
    resp.status(200).send(wr);
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
