import { Model, Document } from 'mongoose';
import { ItemsQueued } from '../models/itemsQueued';
import { ItemsUshered } from '../models/itemsUshered';

export async function addItemsQueuedBulk(itemsArray:any[]){
    return await addItemsBulk(itemsArray, 'IQ');
}

export async function addItemsUsheredBulk(itemsArray:any[]){
    return await addItemsBulk(itemsArray, 'IU');
}

export async function addItemsBulk(itemsArray:any[], docType: 'IQ'| 'IU' = 'IQ'){
    console.log(`adding ${itemsArray.length} items to Mongo`);
    const mongooseModel:Model<Document> = docType === 'IQ' ? ItemsQueued : ItemsUshered;
    try {
        const result = await mongooseModel.insertMany(itemsArray).catch((err)=> {
            console.log(`insertMany err: ${err}`)
        });
        console.log(`result ${JSON.stringify(result)}`)
        return result;
    } catch (err) {
        console.log(`err in addItemsUsheredBulk:`, err)
        throw err;
    }
}