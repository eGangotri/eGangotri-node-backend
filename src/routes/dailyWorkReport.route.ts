const express = require("express");
import { DailyWorkReport } from "../models/dailyWorkReport";
import { generateCSV, generateCSVApi2 as generateCSVAsJsonArray, generateCSVAsFile, getListOfDailyWorkReport } from "../services/dailyWorkReportService";
import { Request, Response } from "express";
import { validateUserFromRequest } from "./utils";

export const dailyWorkReportRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/dailyWorkReport/add 
JSON Body 
{
	"operatorName": "test2",
	"center": "Haridwar",
	"lib": "Gurukul-Kangri",
	"totalPdfCount": 3,
	"totalPageCount": 896,
	"totalSize": "460.3 MB",
	"totalSizeRaw": "3333333333",
	"dateOfReport": "2023-05-30T17:11:57.792Z",
	"pageCountStats": [
		{
			"fileName": "The complete works of the swami vivekananda).pdf",
			"pageCount": 471,
			"fileSize": "234.58 MB"
		},
		{
			"fileName": "Sharika leela.pdf",
			"pageCount": 284,
			"fileSize": "111.25 MB"
		},
		{
			"fileName": "The temples of india).pdf",
			"pageCount": 141,
			"fileSize": "114.47 MB"
		}
	],
	"password": "22222"
}
 */

dailyWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const operatorName = req.body.operatorName

    if (await validateUserFromRequest(req)) {
      const wr = new DailyWorkReport(req.body);

      //Check if any request was sent in Last 2 hours
      const _query:typeof req.query = {};
      _query['isLastTwoHours'] = 'true';
      _query['operatorName'] = operatorName;

      const items = await getListOfDailyWorkReport(_query);
      if (items && items.length > 0) {
        console.log(`dailyWorkReportRoute: /add ${JSON.stringify(items)} ${items[0]}`);
         const updatedDocument = await wr.updateOne({_id:items[0]._id}).exec();

         console.log(`dailyWorkReportRoute:updatedDocument ${JSON.stringify(updatedDocument)}}`);

        resp.status(200).send({
          "warning": `Since Last Submission Request < 2 Hours. exisiting Data is merely overwritten not inserted.${wr._id} for ${operatorName}`
        });

      }

      else {
        console.log(`dailyWorkReportRoute /add ${JSON.stringify(wr)}`);
        await wr.save();
        resp.status(200).send({
          "success": `Added Daily Report Stats with Id ${wr._id} for ${operatorName}`
        });
      }
    }
    else {
      resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
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
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );
    resp.status(200).send({
      response: items,
    });
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

//localhost/dailyWorkReport/csv?startDate="1-Jan-2023"&endDate="31-Jun-2023"
dailyWorkReportRoute.get("/csv", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateCSV(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

//localhost/dailyWorkReport/csvAsJsonArray?startDate="1-Jan-2023"&endDate="31-Jun-2023"
dailyWorkReportRoute.get("/csvAsJsonArray", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateCSVAsJsonArray(items)
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
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateCSVAsFile(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});
