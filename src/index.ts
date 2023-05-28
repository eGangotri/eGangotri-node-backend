const express = require("express");
import * as serverless from "serverless-http";
const { itemsQueuedRoute }  = require("./routes/itemsQueued.route");
const { itemsUsheredRoute }  = require( "./routes/itemsUshered.route");
const { launchGradleRoute } = require("./routes/launchGradle.route");
const { dailyWorkReportRoute } = require("./routes/dailyWorkReport.route");
const { userRoute } = require("./routes/userRoute.route");

const{ connectToMongo } = require("./services/dbService");
const fs  = require("fs");

const app = express();
const hostname = "127.0.0.1";
const port = 80;

connectToMongo();
app.use(express.json());
app.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", function (req: any, res: any) {
  res.send({
    response:"eGangotri-node-backend"
  });
});

app.use("/itemsQueued", itemsQueuedRoute);
app.use("/itemsUshered", itemsUsheredRoute);
app.use("/launchGradle", launchGradleRoute);
app.use("/dailyWorkReport", dailyWorkReportRoute);
app.use("/user", userRoute);

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  const file = "C:/tmp/failedUploadsFixing";
  try {
    if (fs.existsSync(file)) {
      const fileModifiedDate: Date = fs.statSync(file).birthtime;
      const ctime: Date = fs.statSync(file).ctime;
      const birthtime: Date = fs.statSync(file).birthtime;
      console.log(
        `birthtime ${birthtime} \n fileModifiedDate:${fileModifiedDate} \nctime ${ctime}`
      );
    }
  } catch (err) {
    console.error(`err: ${err}`);
  }
});
