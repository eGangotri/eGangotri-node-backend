import * as express from 'express';
import { ItemsQueued } from '../models/itemsQueued';
import * as mongoose from 'mongoose';
import { getListOfItemsQueued, getListOfItemsQueuedArrangedByProfile } from '../services/dbService';

export const itemsQueuedRoute = new express.Router();

itemsQueuedRoute.post('/add', async (req, resp) => {
    try {
        const iq = new ItemsQueued(req.body);
        await iq.save();
        resp.status(200).send(iq);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/list', async (req, resp) => {
    try {
        const items = await getListOfItemsQueued(getLimit(req));
        console.log(`after`)
        resp.status(200).send(items);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

itemsQueuedRoute.get('/listByProfile', async (req, resp) => {
    try {
        const groupedItems = await getListOfItemsQueuedArrangedByProfile(getLimit(req));
        resp.status(200).send(groupedItems);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

function getLimit(req){
    const limit = req.query.limit || "100"
    console.log(`req.query ${JSON.stringify(req.query)} ${limit}`);
    return parseInt(limit);
}