import { Model, Document } from 'mongoose';
import { ItemsQueued } from '../models/itemsQueued';
import { ItemsUshered } from '../models/itemsUshered';
import { DOC_TYPE } from '../common';

export async function addItemsQueuedBulk(itemsArray:any[]){
    return await addItemsBulk(itemsArray, DOC_TYPE.IQ);
}

export async function addItemsUsheredBulk(itemsArray:any[]){
    return await addItemsBulk(itemsArray, DOC_TYPE.IU);
}

export async function addItemsBulk(itemsArray:any[], docType: DOC_TYPE = DOC_TYPE.IQ){
    if(itemsArray.length < 1){
        return
    }
    const csvForInsertion = itemsArray[0].csvName;
    console.log(`adding ${itemsArray.length} items for ${csvForInsertion} to Mongo`);
    const mongooseModel:Model<Document> = docType === DOC_TYPE.IQ ? ItemsQueued : ItemsUshered;
    try {
        const result = await mongooseModel.insertMany(itemsArray).catch((err)=> {
            console.log(`insertMany err (${csvForInsertion})  (${typeof itemsArray}) : ${err}`)
        });
        //console.log(`result ${JSON.stringify(result)}`)
        return result;
    } catch (err) {
        console.log(`err((${csvForInsertion})) in addItemsUsheredBulk:`, err)
        throw err;
    }
}