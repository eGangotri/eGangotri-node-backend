import { DOC_TYPE } from "../common";
import { mongoDbUrlWithDbName, MONGO_OPTIONS } from "../db/connection";
import mongoose from "mongoose";
import * as _ from "lodash";
import { getLimit } from "../routes/utils";
import { ellipsis } from "../mirror/utils";
import { ItemsListOptionsType } from "../types/listingTypes";
import { BOOLEAN_FOUR_STATE } from "./ServiceUtils";
import { checkDatabaseHealth, setupConnectionMonitoring, withRetry } from "../utils/dbRetry";

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
      // Close any existing connections first to ensure clean state
      if (mongoose.connection.readyState !== 0) {
        console.log('Closing existing MongoDB connection before reconnecting...');
        await mongoose.connection.close();
      }

      // Apply mongoose global settings before connecting
      mongoose.set('strictQuery', false);

      // Only enable debug in development environment
      const isDebug = process.env.NODE_ENV !== 'production';
      if (isDebug) {
        // mongoose.set('debug', { color: true, shell: true });
      }
      mongoose.set('debug', false);
      // Connect with retry strategy
      await withRetry(async () => {
        // Use the optimized MONGO_OPTIONS from connection.ts
        await mongoose.connect(mongoDbUrl, MONGO_OPTIONS as mongoose.ConnectOptions);
      }, {
        maxRetries: 5,
        retryDelay: 10000, // 10 seconds between retries for high-latency connections
        timeout: 180000  // 3 minutes timeout matching serverSelectionTimeoutMS
      });

      // Setup connection monitoring
      setupConnectionMonitoring();

      // Initial health check
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        throw new Error('Database health check failed after connection');
      }

      console.log(`Successfully connected to ${ellipsis(mongoDbUrl)}`);

      // Set up connection event handlers
      mongoose.connection.on("error", (err) => {
        console.error(`MongoDB connection error: ${err}`);
        // Don't crash the server on connection errors
      });

      mongoose.connection.once("open", () => {
        console.log(`MongoDB connection established to ${ellipsis(mongoDbUrl)}`);
      });
    } catch (err) {
      console.error("Failed to connect to MongoDB:", err);
      // Don't throw here to prevent app crash, but log the error
    }
  } else {
    console.error(`No MongoDB URL provided`);
  }
}
