const express = require("express");

import {itemsQueuedRoute} from "./routes/itemsQueued.route";
import {itemsUsheredRoute} from "./routes/itemsUshered.route";
import {launchGradleRoute} from "./routes/launchGradle.route";
import {dailyWorkReportRoute} from "./routes/dailyWorkReport.route";
import {dailyCatWorkReportRoute} from "./routes/dailyCatWorkReport.route";
import {uploadCycleRoute} from "./routes/uploadCycle.route";
import { launchYarnRoute } from "./routes/launchYarn.route";

import {userRoute} from "./routes/userRoute.route";
import {connectToMongo} from "./services/dbService";

import { GLOBAL_DB_NAME } from './db/connection';
import { dailyQAWorkReportRoute } from "./routes/dailyQAWorkReport.route";

const egangotri = express();
const hostname = "localhost";
const port = process.env.PORT || 8000;
const args = process.argv.slice(2);
console.log("Command-line arguments:", args);

egangotri.use(express.json());
egangotri.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const deployDate = "11-02-24"
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
egangotri.use("/yarn", launchYarnRoute);

connectToMongo(args).then(() => {
  egangotri.listen(port,'0.0.0.0', async () => {
    console.log(`Server - deployed ${deployDate} - running at http://${hostname}:${port}/`, new Date());
  });
})


