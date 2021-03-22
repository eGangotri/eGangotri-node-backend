import * as express from 'express';
import { processCSVPair } from './services/execute';
import { connection_config } from './db/connection';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
  res.send('Hello World')
})

const HOME_FOLDER = 'C:/Users/Chetan Pandey/eGangotri'
const ITEM_QUEUED_FOLDER = `${HOME_FOLDER}/items_queued`;
const ITEM_USHERED_FOLDER = `${HOME_FOLDER}/items_ushered`;

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  const queuedFile = filesOnGivenDate(ITEM_QUEUED_FOLDER, "ALL");
  const usheredFile = filesOnGivenDate(ITEM_USHERED_FOLDER,"ALL");

  dbConnect();
  for(let i = 0; i < queuedFile.length;i++){
    processCSVPair(queuedFile[i], usheredFile[i]);
  }

});

/**
 * 
 * @param folderName 
 * @param dateString must be DD-MMM-YYYY. Ex: 21-Mar-2021
 * if dateString === "ALL" then all files will be processed
 */
function filesOnGivenDate(folderName:string, dateString:string = ""){
  let processableFiles = []
  const todaysDateFormatted = dateString != "ALL" ? (dateString || (moment(new Date())).format('DD-MMM-YYYY') ):"ALL";
  console.log(`Searching for Files in ${folderName} for Today ${todaysDateFormatted}`);

  fs.readdirSync(path.resolve("/", folderName)).forEach(file => {
    if(dateString === "ALL"){
      processableFiles.push(`${folderName}/${file}`);
    }
    else if (file.indexOf(todaysDateFormatted) > 0) {
      processableFiles.push(`${folderName}/${file}`);
    }
  });

  console.log(`We will process following Files: ${processableFiles}`)
  return processableFiles;
}

function dbConnect() {
  console.log('attempting to connect to DB');
  if (connection_config.DB_URL) {
    mongoose.connect(connection_config.DB_URL, connection_config.options);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
      // we're connected!
    });
  }
}

