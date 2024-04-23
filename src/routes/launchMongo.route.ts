import * as express from 'express';
import { getListOfArchiveAccts, getListOfArchiveSources, getListOfGDriveSources } from '../services/mongoService';

export const launchMongoRoute = express.Router();

launchMongoRoute.post('/getAllGoogleDriveSources', async (req: any, resp: any) => {
    try {
        const response = await getListOfGDriveSources();
        console.log(`:getAllGoogleDriveSources: ${JSON.stringify(response)}`);
        resp.status(200).send({
            itemCount: response?.length || 0,
            response
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchMongoRoute.post('/getAllArchiveSources', async (req: any, resp: any) => {
    try {
        const response = await getListOfArchiveSources();
        console.log(`:getAllArchiveSources: ${JSON.stringify(response)}`);
        resp.status(200).send({
            itemCount: response?.length || 0,
            response
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchMongoRoute.post('/getListOfArchiveAccts', async (req: any, resp: any) => {
    try {
        const response = await getListOfArchiveAccts();
        console.log(`:getListOfArchiveAccts: ${JSON.stringify(response)}`);
        resp.status(200).send({
            itemCount: response?.length || 0,
            response
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})