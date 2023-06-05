import { Model, Document } from "mongoose";
import { ItemsQueued } from "../models/itemsQueued";
import { ItemsUshered } from "../models/itemsUshered";
import { DOC_TYPE } from "../common";
import { MONGO_DB_URL, MONGO_OPTIONS } from "../db/connection";
import mongoose from "mongoose";
import { subDays } from "date-fns";

import * as _ from "underscore";
import { getLimit } from "../routes/utils";
import { DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH } from "../utils/constants";
import { ItemsListOptionsType } from "./types";


export async function addItemsQueuedBulk(itemsArray: any[]) {
  return await addItemstoMongoBulk(itemsArray, DOC_TYPE.IQ);
}

export async function addItemsUsheredBulk(itemsArray: any[]) {
  return await addItemstoMongoBulk(itemsArray, DOC_TYPE.IU);
}

export async function addItemstoMongoBulk(
  itemsArray: any[],
  docType: DOC_TYPE = DOC_TYPE.IQ
) {
  if (itemsArray.length < 1) {
    return;
  }
  const csvForInsertion = itemsArray[0].csvName;
  console.log(
    `adding ${itemsArray.length} items for ${csvForInsertion} to Mongo`
  );
  // const mongooseModel: Model<Document> =
  //   docType === DOC_TYPE.IQ ? ItemsQueued : ItemsUshered;
  // try {
  //   const result = await mongooseModel.insertMany(itemsArray).catch((err) => {
  //     console.log(
  //       `insertMany err (${csvForInsertion})  (${typeof itemsArray}) : ${err}`
  //     );
  //   });
  //   console.log(`addItemstoMongoBulk:result ${JSON.stringify(result)}`);
  //   return result;
  // } catch (err) {
  //   console.log(`err((${csvForInsertion})) in addItemsUsheredBulk:`, err);
  //   throw err;
  // }
}

export function setOptionsForItemListing(queryOptions: ItemsListOptionsType) {
  // Empty `filter` means "match all documents"
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate) {
    mongoOptionsFilter = {
      createdAt: {
        $gte: new Date(queryOptions?.startDate),
        $lte: new Date(queryOptions?.endDate),
      },
    };
  } else {
    mongoOptionsFilter = { createdAt: { $gte: subDays(new Date(), DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH) } };
  }

  console.log(`ids ${JSON.stringify(queryOptions)}`)

  if(queryOptions?.ids){
    const ids:string[] = queryOptions?.ids.split(",")
    console.log(`ids ${ids}`)
    mongoOptionsFilter = {_id : { $in: ids }}
  }

  if (queryOptions?.archiveProfile){
    const archiveProfiles:string[] = queryOptions?.archiveProfile.split(",")
    console.log(`archiveProfiles ${archiveProfiles}`)
    mongoOptionsFilter = {archiveProfile : { $in: archiveProfiles }}
  }
  const limit: number = getLimit(queryOptions?.limit);
  return {limit, mongoOptionsFilter};
}


export async function connectToMongo() {
  console.log("\nAttempting to connect to DB:", MONGO_DB_URL);
  if (MONGO_DB_URL) {
    try {
      await mongoose.connect(MONGO_DB_URL);
      const db = mongoose.connection;
      db.on("error", () => {
        console.log("connection error:");
      });
      db.once("open", () => {
        // we're connected!
        mongoose.set('debug', true)
        console.log(`we are connected to ${MONGO_DB_URL}`);
      });
    } catch (err) {
      console.log("could not connect to mongoose DB\n", err);
    }
  } else {
    console.log(`No ${MONGO_DB_URL}`);
  }
}
