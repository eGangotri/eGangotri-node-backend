import { DOC_TYPE } from "../common";
import { mongoDbUrlWithDbName } from "../db/connection";
import mongoose from "mongoose";

import * as _ from "lodash";
import { getLimit } from "../routes/utils";
import { ellipsis } from "../mirror/utils";
import { BOOLEAN_FOUR_STATE, ItemsListOptionsType } from "../types/listingTypes";


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
  }
  //else {
  //   mongoOptionsFilter = { createdAt: { $gte: subDays(new Date(), DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH) } };
  // }

  console.log(`queryOptions ${JSON.stringify(queryOptions)}`)

  if (queryOptions?.ids) {
    const ids: string[] = queryOptions?.ids.split(",")
    console.log(`ids ${ids}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, id: { $in: ids } };
  }

  if (queryOptions?.archiveProfile) {
    const archiveProfiles: string[] = queryOptions?.archiveProfile.split(",")
    console.log(`archiveProfiles ${archiveProfiles}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, archiveProfile: { $in: archiveProfiles } };
  }

  if (queryOptions?.uploadCycleId) {
    const uploadCycleIds: string[] = queryOptions?.uploadCycleId.split(",")
    console.log(`uploadCycleIds ${uploadCycleIds}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, uploadCycleId: { $in: uploadCycleIds } };
  }

  if (queryOptions?.uploadFlag) {
    if (queryOptions?.uploadFlag === BOOLEAN_FOUR_STATE.TRUE) {
      mongoOptionsFilter = { ...mongoOptionsFilter, uploadFlag: true };
    }
    else if (queryOptions?.uploadFlag === BOOLEAN_FOUR_STATE.NULL_FALSE) {
      mongoOptionsFilter = { ...mongoOptionsFilter, $or: [{ uploadFlag: false }, { uploadFlag: null }] };
    }
    else if (queryOptions?.uploadFlag === BOOLEAN_FOUR_STATE.FALSE) {
      mongoOptionsFilter = { ...mongoOptionsFilter, uploadFlag: false };
    }
    else if (queryOptions?.uploadFlag === BOOLEAN_FOUR_STATE.NULL) {
      mongoOptionsFilter = { ...mongoOptionsFilter, uploadFlag: null };
    }
  }


  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}


export async function connectToMongo(_args: string[] = []) {
  const mongoDbUrl = mongoDbUrlWithDbName(!_.isEmpty(_args) ? _args[0] : "");
  console.log("\nAttempting to connect to DB:", ellipsis(mongoDbUrl));
  if (mongoDbUrl) {
    try {
      await mongoose.connect(mongoDbUrl,
        {
          socketTimeoutMS: 100000,
          useUnifiedTopology: true,
          // useNewUrlParser: true,
          // useCreateIndex: true,
          // useFindAndModify: false,
          // poolSize: parseInt(process.env.POOL_SIZE!),
        } as mongoose.ConnectOptions);
      const db = mongoose.connection;
      db.on("error", () => {
        console.log("connection error:");
      });
      db.once("open", () => {
        // we're connected!
        mongoose.set('debug', true)
        console.log(`we are connected to ${mongoDbUrl}`);
      });
    } catch (err) {
      console.log("could not connect to mongoose DB\n", err);
    }
  } else {
    console.log(`No ${mongoDbUrl}`);
  }
}
