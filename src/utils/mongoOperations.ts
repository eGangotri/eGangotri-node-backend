import mongoose from 'mongoose';
import { logger } from './logger';
import { withRetry } from './dbRetry';

/**
 * Wrapper for MongoDB operations with improved timeout handling
 * Especially useful for high-latency VPN connections
 */

/**
 * Execute a MongoDB find operation with retry logic and timeout handling
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param projection Fields to include/exclude
 * @param options Query options
 * @returns Query result
 */
export async function findWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any = {},
  projection: any = null,
  options: any = {}
): Promise<any> {
  logger.info(`Executing find operation on ${(model as any).collection.name} with options:`, { filter, options });
  
  return await withRetry(async () => {
    const query = model.find(filter, projection, {
      // Ensure we have reasonable timeouts for each operation
      maxTimeMS: 60000, // 1 minute operation timeout
      ...options
    });
    
    return await query.exec();
  });
}

/**
 * Execute a MongoDB findOne operation with retry logic and timeout handling
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param projection Fields to include/exclude
 * @param options Query options
 * @returns Query result
 */
export async function findOneWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any = {},
  projection: any = null,
  options: any = {}
): Promise<any> {
  logger.info(`Executing findOne operation on ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    const query = model.findOne(filter, projection, {
      // Ensure we have reasonable timeouts for each operation
      maxTimeMS: 60000, // 1 minute operation timeout
      ...options
    });
    
    return await query.exec();
  });
}

/**
 * Execute a MongoDB countDocuments operation with retry logic and timeout handling
 * @param model Mongoose model
 * @param filter Filter criteria
 * @returns Count of documents
 */
export async function countWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any = {}
): Promise<number> {
  logger.info(`Executing count operation on ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    return await model.countDocuments(filter).maxTimeMS(30000).exec();
  });
}

/**
 * Execute a MongoDB aggregate operation with retry logic and timeout handling
 * @param model Mongoose model
 * @param pipeline Aggregation pipeline
 * @param options Aggregation options
 * @returns Aggregation result
 */
export async function aggregateWithRetry<T>(
  model: mongoose.Model<T>,
  pipeline: any[],
  options: any = {}
): Promise<any> {
  logger.info(`Executing aggregate operation on ${(model as any).collection.name}`);
  
  return await withRetry(async () => {
    return await model.aggregate(pipeline, {
      maxTimeMS: 120000, // 2 minute operation timeout
      allowDiskUse: true, // Allow disk use for large aggregations
      ...options
    });
  });
}

/**
 * Execute a MongoDB save/create operation with retry logic
 * @param document Mongoose document to save
 * @returns Saved document
 */
export async function saveWithRetry<T extends mongoose.Document>(document: T): Promise<T> {
  logger.info(`Saving document to collection`);
  
  return await withRetry(async () => {
    return await document.save();
  });
}

/**
 * Execute a MongoDB insertMany operation with retry logic
 * @param model Mongoose model
 * @param docs Documents to insert
 * @param options Insert options
 * @returns Insert result
 */
export async function insertManyWithRetry<T>(
  model: mongoose.Model<T>,
  docs: any[],
  options: any = {}
): Promise<any> {
  logger.info(`Inserting ${docs.length} documents to ${(model as any).collection.name}`);
  
  return await withRetry(async () => {
    return await model.insertMany(docs, {
      ordered: false, // Continue inserting documents even if some fail
      ...options
    });
  });
}

/**
 * Execute a MongoDB updateOne operation with retry logic
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param update Update operations
 * @param options Update options
 * @returns Update result
 */
export async function updateOneWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any,
  update: any,
  options: any = {}
): Promise<any> {
  logger.info(`Updating document in ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    return await model.updateOne(filter, update, options);
  });
}

/**
 * Execute a MongoDB updateMany operation with retry logic
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param update Update operations
 * @param options Update options
 * @returns Update result
 */
export async function updateManyWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any,
  update: any,
  options: any = {}
): Promise<any> {
  logger.info(`Updating multiple documents in ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    return await model.updateMany(filter, update, options);
  });
}

/**
 * Execute a MongoDB deleteOne operation with retry logic
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param options Delete options
 * @returns Delete result
 */
export async function deleteOneWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any,
  options: any = {}
): Promise<any> {
  logger.info(`Deleting document from ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    return await model.deleteOne(filter, options);
  });
}

/**
 * Execute a MongoDB deleteMany operation with retry logic
 * @param model Mongoose model
 * @param filter Filter criteria
 * @param options Delete options
 * @returns Delete result
 */
export async function deleteManyWithRetry<T>(
  model: mongoose.Model<T>,
  filter: any,
  options: any = {}
): Promise<any> {
  logger.info(`Deleting multiple documents from ${(model as any).collection.name} with filter:`, filter);
  
  return await withRetry(async () => {
    return await model.deleteMany(filter, options);
  });
}
