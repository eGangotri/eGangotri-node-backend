import * as express from 'express';
import { itemsQueuedRoute } from './routes/itemsQueued.route'
import { connectToMongo } from './services/dbService';

const app = express();
const hostname = '127.0.0.1';
const port = 4000;

connectToMongo()

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', function (req, res) {
  res.send('eGangotri-node-upload-monitor');
})

app.use('/itemsQueued', itemsQueuedRoute);

app.listen(port, async () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


