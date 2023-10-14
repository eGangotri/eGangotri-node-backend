const express = require("express");

import {itemsQueuedRoute} from "./routes/itemsQueued.route";
import {itemsUsheredRoute} from "./routes/itemsUshered.route";
import {launchGradleRoute} from "./routes/launchGradle.route";
import {dailyWorkReportRoute} from "./routes/dailyWorkReport.route";
import {dailyCatWorkReportRoute} from "./routes/dailyCatWorkReport.route";
import {uploadCycleRoute} from "./routes/uploadCycle.route";

import {userRoute} from "./routes/userRoute.route";
import {connectToMongo} from "./services/dbService";

import { GLOBAL_DB_NAME } from './db/connection';

const egangotri = express();
const hostname = "127.0.0.1";
const port = process.env.PORT || 80;
const args = process.argv.slice(2);
console.log("Command-line arguments:", args);

egangotri.use(express.json());
egangotri.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

egangotri.get("/", function (req: any, res: any) {
  res.send({
    response: `eGangotri-node-backend (${GLOBAL_DB_NAME})`
  });
});

egangotri.use("/itemsQueued", itemsQueuedRoute);
egangotri.use("/itemsUshered", itemsUsheredRoute);
egangotri.use("/execLauncher", launchGradleRoute);
egangotri.use("/dailyWorkReport", dailyWorkReportRoute);
egangotri.use("/dailyCatWorkReport", dailyCatWorkReportRoute);
egangotri.use("/uploadCycleRoute", uploadCycleRoute);
egangotri.use("/user", userRoute);

connectToMongo(args).then(() => {
  egangotri.listen(port, async () => {
    console.log(`Server running at http://${hostname}:${port}/`, new Date());
  });
})


