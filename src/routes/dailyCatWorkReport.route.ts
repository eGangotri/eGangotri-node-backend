const express = require("express");
import { generateCatWorkReportCSV, generateCatWorkReportCSVApi2 } from "../services/CsvUtil";
import { deleteRowsByIds } from "../services/dailyWorkReportService";
import { Request, Response } from "express";
import { validateSuperAdminUserFromRequest, validateUserFromRequest } from "../services/userService"
import { getDateTwoHoursBeforeNow, replaceQuotesAndSplit } from "../excelToMongo/Util";
import _ from "lodash";
import { DailyCatWorkReport } from "../models/dailyCatWorkReport";
import { generateCatCSVAsFile, generateCatCSVAsFileForOperatorAndEntryCountOnly, generateCatCSVAsFileOfAggregates, getListOfDailyCatWorkReport } from "../services/dailyCatWorkReportService";

export const dailyCatWorkReportRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/dailyWorkReport/add 
JSON Body 
{
  "title": "eGangotri Daily Catalog Work Report",
  "operatorName": "admin",
  "catalogProfile": "Treasures-8",
  "entryFrom": 1,
  "entryTo": 11,
  "skipped": 2,
  "timeOfRequest": "2023-07-18T09:30:20.401Z",
  "entryCount": 8,
  "link": "https://docs.google.com/spreadsheets/d/1masb0zc_bvOYU1r70cjf6sPvExbF5bF6s_VDPeBH4KY/edit#gid=0",
  "notes": "",
  "password": ""
}
*/

dailyCatWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const operatorName = req.body.operatorName
    if (operatorName) {
      resp.status(400).send({ error: "Cataloging is not working.Non-functional" });
    }

    else {
      if (await validateUserFromRequest(req)) {
        const dailyCatWorkReport = new DailyCatWorkReport(req.body);

        //Check if any request was sent in Last 2 hours
        const _query: typeof req.query = {};
        _query['isLastTwoHours'] = 'true';
        _query['operatorName'] = operatorName;

        const preExisting = await getListOfDailyCatWorkReport(_query);
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
          await DailyCatWorkReport.deleteMany(filter);
          await dailyCatWorkReport.save();
          resp.status(200).send({
            "warning": `Since Last Submission Request < 2 Hours. exisiting Data is merely overwritten not inserted. for ${operatorName}`
          });

        }
        else {
          console.log(`dailyCatWorkReportRoute /add ${JSON.stringify(dailyCatWorkReport)}`);
          await dailyCatWorkReport.save();
          resp.status(200).send({
            "success": `Added Daily Report Stats with Id ${dailyCatWorkReport._id} for ${operatorName}`
          });
        }
      }
      else {
        resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
      }
    }
  }
  catch (err: any) {
    console.log("Error", err);
    resp.status(400).send({ error: err });
  }
});

dailyCatWorkReportRoute.get("/list", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
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


dailyCatWorkReportRoute.get("/listIds", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
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
/**
 * 
 * {
  "_ids": "64bf2382c0a3e0e17c64b472,64bbc572c0a3e0e17c64b124,64bbc542c0a3e0e17c64b123",
  "superadmin_user": "",
  "superadmin_password": ""
}
 */
//non-functional
dailyCatWorkReportRoute.delete("/delete", async (req: Request, resp: Response) => {
  try {
    const _ids = req.body?._ids || "";
    const idsAsCSV = replaceQuotesAndSplit(_ids);
    const _validate = await validateSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      if (_.isEmpty(_ids)) {
        console.log(`cannot proceed _id not provided`);
        resp.status(400).send({
          response: `Must have param '_ids' containing one or more id as coma-separated value`,
        });
      }
      else {
        if (idsAsCSV.length > 10) {
          resp.status(400).send({
            response: `Expected deletion of ${idsAsCSV.length} items but more than 10 is not allowed`,
          });
        }
        const items = await getListOfDailyCatWorkReport(req.body);
        console.log(
          `after getListOfDailyWorkReport retrieved item count: ${items.length}`
        );

        if (_.isEmpty(items)) {
          resp.status(200).send({
            response: "No _ids matching found. No deletion",
          });
        }
        else {
          const _idsfiltered = items.filter((item) => idsAsCSV.includes(item._id.toString())).map((x) => x._id.toString())
          console.log(`_ids2 ${_idsfiltered.length} idsAsCSV.length ${idsAsCSV.length}`)
          const status = await deleteRowsByIds(_idsfiltered);
          resp.status(200).send({
            response: `Deleted ${status.deletedCount} items from ${idsAsCSV.length} _ids provided`,
            message: `${JSON.stringify(status)}`
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
dailyCatWorkReportRoute.get("/csv", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
    console.log(
      `after getListOfDailyCatWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateCatWorkReportCSV(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

//localhost/dailyWorkReport/csvAsJsonArray?startDate="1-Jan-2023"&endDate="31-Jun-2023"
dailyCatWorkReportRoute.get("/csvAsJsonArray", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateCatWorkReportCSVApi2(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyCatWorkReportRoute.get("/csvAsFile", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    if (req?.query?.aggregations === "true") {
      generateCatCSVAsFileOfAggregates(resp, items)
    }
    else {
      generateCatCSVAsFile(resp, items)
    }
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyCatWorkReportRoute.get("/csvAsFileOnlyOperatorAndPdfCount", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyCatWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateCatCSVAsFileForOperatorAndEntryCountOnly(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

