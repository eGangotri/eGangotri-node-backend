import { Model, Document } from 'mongoose';
import { ItemsQueued } from '../models/itemsQueued';
import { ItemsUshered } from '../models/itemsUshered';
import { DOC_TYPE } from '../common';
import { connection_config } from '../db/connection';
import mongoose from "mongoose";
import * as _ from 'underscore';

export async function addItemsQueuedBulk(itemsArray: any[]) {
    return await addItemsBulk(itemsArray, DOC_TYPE.IQ);
}

export async function addItemsUsheredBulk(itemsArray: any[]) {
    return await addItemsBulk(itemsArray, DOC_TYPE.IU);
}

export async function addItemsBulk(itemsArray: any[], docType: DOC_TYPE = DOC_TYPE.IQ) {
    if (itemsArray.length < 1) {
        return
    }
    const csvForInsertion = itemsArray[0].csvName;
    console.log(`adding ${itemsArray.length} items for ${csvForInsertion} to Mongo`);
    const mongooseModel: Model<Document> = docType === DOC_TYPE.IQ ? ItemsQueued : ItemsUshered;
    try {
        const result = await mongooseModel.insertMany(itemsArray).catch((err) => {
            console.log(`insertMany err (${csvForInsertion})  (${typeof itemsArray}) : ${err}`)
        });
        //console.log(`result ${JSON.stringify(result)}`)
        return result;
    } catch (err) {
        console.log(`err((${csvForInsertion})) in addItemsUsheredBulk:`, err)
        throw err;
    }
}

export async function getListOfItemsQueued(limit: number) {
    // Empty `filter` means "match all documents"
    const filter = { "createdAt": { $gte: new Date().getDate() - 10 } };
    const items = await ItemsQueued.find(filter).sort({ 'createdAt': 1 })
        .limit(limit)
    console.log(`items ${items}`)
    return items;
}

export async function getListOfItemsQueuedArrangedByProfile(limit: number) {
    const items = await getListOfItemsQueued(limit);
    const groupedItems = _.groupBy(items, function(item:any){ return item.archiveProfile; });
    console.log(`groupedItems ${JSON.stringify(groupedItems)}`);
    return groupedItems;
}

export function connectToMongo() {
    console.log('\nAttempting to connect to DB');
    if (connection_config.DB_URL) {
        mongoose.connect(connection_config.DB_URL, connection_config.options);
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function () {
            // we're connected!
        });
    }
}