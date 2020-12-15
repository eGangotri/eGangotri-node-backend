import * as express from 'express';
import { processCSVPair } from './services/execute';
import { connection_config } from './db/connection';
import * as mongoose from 'mongoose';

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);

  const qFP = 'C:\\Users\\Chetan Pandey\\eGangotri\\items_queued';
  const qF = 'queued_items_15-Dec-2020_12-03-PM.csv';

  const uFP = 'C:\\Users\\Chetan Pandey\\eGangotri\\items_ushered'
  const uF = 'ushered_items_15-Dec-2020_12-03-PM.csv';

  const queuedFile = `${qFP}\\${qF}`;
  const usheredFile = `${uFP}\\${uF}`;

  dbConnect();
  processCSVPair(queuedFile,usheredFile);
});


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

