const express = require("express");
import _ from "lodash";
import { Request, Response } from "express";
import {  validateUserFromRequest } from "../services/userService"
import { getDateTwoHoursBeforeNow } from "../excelToMongo/Util";
import { GDriveUploadWorkReport } from "../models/gDriveUploadWorkReport";
import { getListOfGDriveUploadReport } from "../services/GDriveUploadReportService";

export const gDriveUploadWorkReportRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/gDriveUploadWorkReport/add 
JSON Body 
{"operatorName":"",
"center":"Haridwar",
"lib":"Gurukul-Kangri",
"dateOfReport":"2024-10-08T14:43:55.468Z",
"timeOfRequest":"Tue Oct 08 2024","notes":"",
"gDriveLinks":["https://drive.google.com/drive/u/0/folders/1ktCV2VLJ9fF-sgBKN-lliKdob30xvqEK(0","https://drive.google.com/drive/u/0/folders/1ktCV2VLJ9fF-sgBKN-lliKdob30xvqEK(0"],
"password":""}
}
*/

gDriveUploadWorkReportRoute.post("/add", async (req: Request, resp: Response) => {
  try {
    const operatorName = req.body.operatorName
    const _validateUser = await validateUserFromRequest(req)
    console.log(`validateUserFromRequest ${_validateUser} ${operatorName}`);
    if (_validateUser) {
      const dailyGDriveUploadReport = new GDriveUploadWorkReport(req.body);
      //Check if any request was sent in Last 2 hours
      const _query: typeof req.query = {};
      _query['isLastTwoHours'] = 'true';
      _query['operatorName'] = operatorName;

      const preExisting = await getListOfGDriveUploadReport(_query);
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
        await GDriveUploadWorkReport.deleteMany(filter);
        await dailyGDriveUploadReport.save();
        resp.status(200).send({
          "warning": `Since Last Submission Request < 2 Hours. exisiting Data is merely overwritten not inserted. for ${operatorName}`
        });

      }
      else {
        console.log(`dailyGDriveUploadWorkReportRoute /add ${JSON.stringify(dailyGDriveUploadReport)}`);
        await dailyGDriveUploadReport.save();
        resp.status(200).send({
          "success": `Added Daily Report Stats with Id ${dailyGDriveUploadReport._id} for ${operatorName}`
        });
      }
    }
    else {
      resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
    }
  }
  catch (err: any) {
    console.log("Error", err);
    resp.status(400).send({ error: err });
  }
});

