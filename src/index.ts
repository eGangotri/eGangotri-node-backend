const express = require("express");

import {itemsQueuedRoute} from "./routes/itemsQueued.route";
import {itemsUsheredRoute} from "./routes/itemsUshered.route";
import {launchGradleRoute} from "./routes/launchGradle.route";
import {dailyWorkReportRoute} from "./routes/dailyWorkReport.route";
import {dailyCatWorkReportRoute} from "./routes/dailyCatWorkReport.route";
import {uploadCycleRoute} from "./routes/uploadCycle.route";
import { yarnRoute } from "./routes/yarn.route";

import {userRoute} from "./routes/userRoute.route";
import {connectToMongo} from "./services/dbService";

import { GLOBAL_DB_NAME } from './db/connection';
import { dailyQAWorkReportRoute } from "./routes/dailyQAWorkReport.route";
import { archiveItemRoute } from "./routes/archiveItem.route";
import { yarnListMakerRoute } from "./routes/yarnListMaker.route";
import { googleDriveItemRoute } from "./routes/googleDriveItem.route";
import { launchMongoRoute } from "./routes/launchMongo.route";
import { launchArchiveYarnRoute } from "./routes/launchArchiveYarn.route";
import { yarnExcelRoute } from "./routes/yarnExcel.route";
import "./logger/override";

const egangotri = express();
const hostname = "localhost";
const port = process.env.PORT || 8000;
const args = process.argv.slice(2);
console.log("Command-line arguments:", args);
const BODY_PARSER_LIMIT = '100mb';

egangotri.use(express.json({limit: BODY_PARSER_LIMIT}));
egangotri.use(express.urlencoded({limit: BODY_PARSER_LIMIT, extended: true}));

egangotri.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const deployDate = new Date().toISOString();
egangotri.get("/", function (req: any, res: any) {
  console.log(`GET / ${deployDate}`);
  res.send({
    response: `eGangotri-node-backend ${deployDate} Deployed (${GLOBAL_DB_NAME})`
  });
});

egangotri.use("/itemsQueued", itemsQueuedRoute);
egangotri.use("/itemsUshered", itemsUsheredRoute);
egangotri.use("/execLauncher", launchGradleRoute);
egangotri.use("/dailyWorkReport", dailyWorkReportRoute);
egangotri.use("/dailyCatWorkReport", dailyCatWorkReportRoute);
egangotri.use("/dailyQAWorkReport", dailyQAWorkReportRoute);
egangotri.use("/uploadCycleRoute", uploadCycleRoute);
egangotri.use("/user", userRoute);
egangotri.use("/yarn", yarnRoute);
egangotri.use("/yarnExcel", yarnExcelRoute);
egangotri.use("/yarnListMaker", yarnListMakerRoute);
egangotri.use("/yarnArchive", launchArchiveYarnRoute);

egangotri.use("/searchArchivesDB", archiveItemRoute);
egangotri.use("/searchGDriveDB", googleDriveItemRoute);
egangotri.use("/searchMongo", launchMongoRoute);

connectToMongo(args).then(() => {
  egangotri.listen(port,'0.0.0.0', async () => {
    console.log(`Server - deployed ${deployDate} - running at http://${hostname}:${port}/`, new Date());
  });
})


