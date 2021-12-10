import * as express from 'express';
import { itemsQueuedRoute } from './routes/itemsQueued.route'
import { connectToMongo } from './services/dbService';
import * as fs from 'fs';
import { launchGradleRoute } from './routes/launchGradle.route';

const app = express();
const hostname = '127.0.0.1';
const port = 4000;

connectToMongo();

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', function (req, res) {
  res.send('eGangotri-node-node-backend');
})

app.use('/itemsQueued', itemsQueuedRoute);
app.use('/launchGradle', launchGradleRoute);

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  const file = "C:/Users/Chetan Pandey/eGangotri/items_queued/queued_items_12-Sep-2021_6-17-AM.csv";
  const fileModifiedDate:Date = fs.statSync(file).birthtime;
  const ctime:Date = fs.statSync(file).ctime;
  const birthtime :Date = fs.statSync(file).birthtime ;
  console.log(`birthtime ${birthtime} \n fileModifiedDate:${fileModifiedDate} \nctime ${ctime}`);
});



