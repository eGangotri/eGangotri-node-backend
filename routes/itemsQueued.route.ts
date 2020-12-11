import * as express from 'express';
import { ItemsQueued } from '../models/itemsQueued';
const route = new express.Router();
route.post('/addItemQueued', async (req,resp)=>{
    try{
        const iq = new ItemsQueued(req.body);
        await iq.save();
        resp.status(200).send(iq);
    }
    catch(err:any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})