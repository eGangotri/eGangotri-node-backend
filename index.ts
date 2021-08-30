import * as express from 'express';
import { processCSVPair } from './services/execute';

import * as os from 'os';
import { filesOnGivenDate } from './services/Util';
import { dbConnect } from './services/dbService';

const HOME_DIR = os.homedir();

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
  res.send('eGangotri-node-upload-monitor');
})

const HOME_FOLDER = `${HOME_DIR}/eGangotri`;
const ITEM_QUEUED_FOLDER = `${HOME_FOLDER}/items_queued`;
const ITEM_USHERED_FOLDER = `${HOME_FOLDER}/items_ushered`;

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  const queuedFile = filesOnGivenDate(ITEM_QUEUED_FOLDER, "ALL");
  const usheredFile = filesOnGivenDate(ITEM_USHERED_FOLDER, "ALL");

  dbConnect();
  for(let i = 0; i < queuedFile.length;i++){
    processCSVPair(queuedFile[i], usheredFile[i]);
  }
});


