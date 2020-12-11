import * as express from 'express';
import { processCSV } from './services/execute';

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  const filePath = 'C:\\Users\\Chetan Pandey\\eGangotri\\items_queued';
  const file = 'queued_items_11-Dec-2020_10-05-AM.csv';
  
  processCSV(`${filePath}/${file}`);
});

