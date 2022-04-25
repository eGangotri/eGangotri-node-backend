const express = require("express");
import { itemsQueuedRoute } from "./routes/itemsQueued.route";
import { connectToMongo } from "./services/dbService";
import * as fs from "fs";
import { launchGradleRoute } from "./routes/launchGradle.route";

const app = express();
const hostname = "127.0.0.1";
const port = 80;

connectToMongo();

app.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", function (req: any, res: any) {
  res.send("eGangotri-node-node-backend");
});

app.use("/itemsQueued", itemsQueuedRoute);
app.use("/launchGradle", launchGradleRoute);

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
