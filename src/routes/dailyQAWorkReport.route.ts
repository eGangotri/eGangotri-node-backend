const express = require("express");
import { generateQAWorkReportCSV, generateQAWorkReportCSVApi2 } from "../services/CsvUtil";
import { deleteRowsByIds } from "../services/dailyWorkReportService";
import { Request, Response } from "express";
import { validateSuperAdminUserFromRequest, validateUserFromRequest } from "../services/userService"
import { getDateTwoHoursBeforeNow, replaceQuotesAndSplit } from "../services/Util";
import _ from "lodash";
import { generateQACSVAsFile, generateQACSVAsFileForOperatorAndEntryCountOnly, generateQACSVAsFileOfAggregates, getListOfDailyQAWorkReport } from "../services/dailyQAWorkReportService";
import { DailyQAWorkReport } from "../models/dailyQAReport";

export const dailyQAWorkReportRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/dailyQAWorkReport/add 
JSON Body 
{
}
{
  "center": "Center Name",
  "lib": "Library Name",
  "dateOfReport": "2022-01-01T00:00:00.000Z",
  "pdfsRenamedCount": 10,
  "coverPagesRenamedCount": 5,
  "coverPagesMoved": true,
  "notes": "Some notes",
  "folderNames": "Folder names",
  "operatorName": "Operator Name",
  "password": ""

}
*/

dailyQAWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const operatorName = req.body.operatorName
    if (!operatorName) {
      resp.status(400).send({ error: "Non-functional" });
    }

    else {
      if (await validateUserFromRequest(req)) {
        const dailyQAWorkReport = new DailyQAWorkReport(req.body);

        //Check if any request was sent in Last 2 hours
        const _query: typeof req.query = {};
        _query['isLastTwoHours'] = 'true';
        _query['operatorName'] = operatorName;

        const preExisting = await getListOfDailyQAWorkReport(_query);
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
          await DailyQAWorkReport.deleteMany(filter);
          await dailyQAWorkReport.save();
          resp.status(200).send({
            "warning": `Since Last Submission Request < 2 Hours. exisiting Data is merely overwritten not inserted. for ${operatorName}`
          });

        }
        else {
          console.log(`dailyQAWorkReportRoute /add ${JSON.stringify(dailyQAWorkReport)}`);
          await dailyQAWorkReport.save();
          resp.status(200).send({
            "success": `Added Daily Report Stats with Id ${dailyQAWorkReport._id} for ${operatorName}`
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

dailyQAWorkReportRoute.get("/list", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
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


dailyQAWorkReportRoute.get("/listIds", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
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
dailyQAWorkReportRoute.delete("/delete", async (req: Request, resp: Response) => {
  try {
    const _ids = req.body?._ids || "";
    const idsAsCSV = replaceQuotesAndSplit(_ids);
    const _validate = await validateSuperAdminUserFromRequest(req);
    if (_validate[0]) {
      if (_.isEmpty(_ids)) {
        console.log(`cannot proceed _id not provided`);
        resp.status(300).send({
          response: `Must have param '_ids' containing one or more id as coma-separated value`,
        });
      }
      else {
        if (idsAsCSV.length > 10) {
          resp.status(300).send({
            response: `Expected deletion of ${idsAsCSV.length} items but more than 10 is not allowed`,
          });
        }
        const items = await getListOfDailyQAWorkReport(req.body);
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
dailyQAWorkReportRoute.get("/csv", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
    console.log(
      `after getListOfDailyQAWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateQAWorkReportCSV(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

//localhost/dailyWorkReport/csvAsJsonArray?startDate="1-Jan-2023"&endDate="31-Jun-2023"
dailyQAWorkReportRoute.get("/csvAsJsonArray", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items[0]}`
    );
    const _csv = generateQAWorkReportCSVApi2(items)
    resp.status(200).send(_csv);
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyQAWorkReportRoute.get("/csvAsFile", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    if (req?.query?.aggregations === "true") {
      generateQACSVAsFileOfAggregates(resp, items)
    }
    else {
      generateQACSVAsFile(resp, items)
    }
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

dailyQAWorkReportRoute.get("/csvAsFileOnlyOperatorAndPdfCount", async (req: Request, resp: Response) => {
  try {
    const items = await getListOfDailyQAWorkReport(req?.query);
    console.log(
      `after getListOfDailyWorkReport retrieved item count: ${items.length}`
    );

    generateQACSVAsFileForOperatorAndEntryCountOnly(resp, items)
  } catch (err: any) {
    console.log("Error", err);
    resp.status(400).send(err);
  }
});

