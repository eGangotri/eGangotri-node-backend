const express = require("express");
import { DailyWorkReport } from "../models/dailyWorkReport";
import { generateCSV, generateCSVApi2 } from "../services/CsvUtil";
import { deleteRowsByIds, generateCSVAsFile, generateCSVAsFileOfAggregates, generateCsvAsFileOnlyOperatorAndPdfCount, generateCsvAsFileOnlyOperatorAndPdfCountAggregate, getListOfDailyWorkReport } from "../services/dailyWorkReportService";
import { Request, Response } from "express";
import { getDateTwoHoursBeforeNow } from "../services/Util";
import _ from "lodash";
import { validateSuperAdminUserFromRequest, validateUserFromRequest } from "../services/userService";

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
  "notes":"",
  "workFromHome":"",
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
      const _query: typeof req.query = {};
      _query['isLastTwoHours'] = 'true';
      _query['operatorName'] = operatorName;

      const preExisting = await getListOfDailyWorkReport(_query);
      if (preExisting && preExisting.length >= 1) {
        console.log(` preExisting[0]._id . ${preExisting.length}`);
        const filter = {
          _id: { $in: preExisting.map(x => x._id) },
          //just to be extra safe
          createdAt: {
            $gte: new Date(getDateTwoHoursBeforeNow()),
            $lte: new Date(new Date()),
          },
        };
        await DailyWorkReport.deleteMany(filter);
        await wr.save();
        resp.status(200).send({
          "warning": `Since Last Submission Request < 2 Hours. exisiting Data is merely overwritten not inserted. for ${operatorName}`
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
    resp.status(400).send({ error: err });
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


dailyWorkReportRoute.get("/listIds", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );
    const itemIds = items?.map((item) => item._id);
    resp.status(200).send({
      response: itemIds,
      responseAsCsv: itemIds?.join(","),
    });
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});


dailyWorkReportRoute.delete("/delete", async (req: Request, resp: Response) => {
  try {
    const _id = req.body?._id;

    const _validate = await validateSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      if (_.isEmpty(_id)) {
        console.log(`cannot proceed _id not provided`);
        resp.status(300).send({
          response: `Must have param _ids containing one or more _id as coma-separated value`,
        });
      }
      else {
        const items = await getListOfDailyWorkReport(req.body);
        console.log(
          `after getListOfDailyWorkReport retrieved item count: ${items.length}`
        );

        if (_.isEmpty(items)) {
          resp.status(200).send({
            response: "No _ids matching found. No deletion",
          });
        }
        else {
          const _ids = items.map((item) => item._id.toString())
          const status = await deleteRowsByIds(_ids);
          resp.status(200).send({
            response: `Deleted ${status.deletedCount} items`,
          });
        }
      }
    }
    else {
      resp.status(200).send({ error: _validate[1] });
    }
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
    const _csv = generateCSVApi2(items)
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

dailyWorkReportRoute.get("/csvAsFileOfAggregates", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateCSVAsFileOfAggregates(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyWorkReportRoute.get("/csvAsFileOnlyOperatorAndPdfCount", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateCsvAsFileOnlyOperatorAndPdfCount(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyWorkReportRoute.get("/csvAsFileOnlyOperatorAndPdfCountAggregate", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateCsvAsFileOnlyOperatorAndPdfCountAggregate(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});
