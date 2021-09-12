import * as express from 'express';
import { ItemsQueued } from '../models/itemsQueued';
import * as mongoose from 'mongoose';

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
        const limit = req.query.limit || "2"
        console.log(`req.query ${JSON.stringify(req.query)} ${limit}`);
        // Empty `filter` means "match all documents"
        const filter = {};
        const items = await ItemsQueued.find(filter).sort({'createdAt': -1})
        .limit(parseInt(limit))
        console.log(`items ${items}`)
        resp.status(200).send(items);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
