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

const app = express();
const hostname = "127.0.0.1";
const port = process.env.PORT || 80;
const args = process.argv.slice(2);
console.log("Command-line arguments:", args);

//connectToMongo(args);
app.use(express.json());
app.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", function (req: any, res: any) {
  res.send({
    response: `eGangotri-node-backend (${GLOBAL_DB_NAME})`
  });
});

app.use("/itemsQueued", itemsQueuedRoute);
app.use("/itemsUshered", itemsUsheredRoute);
app.use("/launchGradle", launchGradleRoute);
app.use("/dailyWorkReport", dailyWorkReportRoute);
app.use("/dailyCatWorkReport", dailyCatWorkReportRoute);
app.use("/uploadCycleRoute", uploadCycleRoute);
app.use("/user", userRoute);

connectToMongo(args).then(() => {
  app.listen(port, async () => {
    console.log(`Server running at http://${hostname}:${port}/`, new Date());
  });
})


