import { ArchiveProfileAndCount, SelectedUploadItem, UploadCycleTableData, UploadCycleTableDataDictionary } from "../mirror/types";
import { IItemsUshered, ItemsUshered } from "../models/itemsUshered";
import { setOptionsForItemListing } from "./dbService";
import { ItemsListOptionsType } from "../types/listingTypes";
import { checkUrlValidityForUploadItems } from "../utils/utils";
import * as _ from 'lodash';
import { UploadCycle } from "../models/uploadCycle";
import { getListOfItemsQueued } from "./itemsQueuedService";
import { getListOfUploadCycles } from "./uploadCycleService";
import { ellipsis } from "../mirror/utils";
import { IItemsQueued } from "models/itemsQueued";
import { Types } from "mongoose";

export async function getListOfItemsUshered(queryOptions: ItemsListOptionsType) {
  try {
    const { limit, mongoOptionsFilter } = setOptionsForItemListing(queryOptions)
    const page = queryOptions?.page || 1;
    const skip = (page - 1) * limit;

    // Skip the count operation entirely to avoid timeouts
    // This is a performance optimization - we won't know the total count
    // but the query will be much faster

    // Apply projection to only retrieve fields we need
    // This reduces the amount of data transferred
    const projection = {
      _id: 1,
      title: 1,
      archiveItemId: 1,
      archiveProfile: 1,
      uploadCycleId: 1,
      uploadFlag: 1,
      datetimeUploadStarted: 1,
      createdAt: 1,
      uploadLink: 1,
      localPath: 1
    };

    // Use a smaller batch size and increase server timeout
    const items = await ItemsUshered.find(mongoOptionsFilter, projection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .maxTimeMS(120000)  // 2 minute timeout
      .lean()  // Convert to plain JavaScript objects
      .batchSize(50)  // Process in smaller batches
      .exec(); // Force execution of the query

    console.log(`Retrieved ${items.length} 
       ${page}`);
    return items;
  } catch (error: any) {
    console.error('Error in getListOfItemsUshered:', error.message);
    if (error.message.includes('buffering timed out')) {
      console.error('Query timed out. Consider using smaller page sizes or adding more specific filters.');
    }
    throw error;
  }
}

export const itemsUsheredVerficationAndDBFlagUpdate = async (uploadCycleIdForVerification: string) => {
  //get all Items_Ushered for uploadCycleIdForVerification
  const itemsUsheredByUploadCycle = await getListOfItemsUshered({
    uploadCycleId: uploadCycleIdForVerification,
  });

  const _itemsUsheredFilter = itemsUsheredByUploadCycle.filter(x => x?.uploadFlag === null || x?.uploadFlag === false || x?.uploadFlag === undefined)
  const total = itemsUsheredByUploadCycle.length;
  console.log(`_itemsUsheredFilter ${_itemsUsheredFilter.length} Total: ${total}`)
  const promises =
    _itemsUsheredFilter.map((item, index) =>
      checkUrlValidityForUploadItems({
        id: new Types.ObjectId(item._id as any),
        archiveId: `${item.archiveItemId}`,
        isValid: true,
        title: item.title
      }, index, total)
    );

  const results: SelectedUploadItem[] = await Promise.all(promises);

  await bulkUpdateUploadedFlag(results);
  await updadeAllUplodVerfiedFlagInUploadCycle(uploadCycleIdForVerification);
  const _profilesAsSet = _.uniq(itemsUsheredByUploadCycle.map(x => x.archiveProfile))
  const archiveProfiles = `(${_profilesAsSet})`;
  const failures = results.filter((x: SelectedUploadItem) => x?.isValid !== true);//accomodates null also   
  const result = {
    successCount: (failures.length === 0) ? "ALL" : total - failures.length,
    failureCount: failures.length,
    status: `Verfification/DB-Marking of ${results.length} previously failed/unverified of (${total}) items for  ${uploadCycleIdForVerification} ${archiveProfiles} completed.`,
    note: "Bad Data Upload Failures are not captured yet",
    failures: failures.map(x => x.title) || "None",
  };
  console.log(`_res ${result.status} ${result.successCount} ${result.failureCount}`)

  return result;
}

export const selectedItemsVerficationAndDBFlagUpdate = async (uploadsForVerification: SelectedUploadItem[]) => {
  const total = uploadsForVerification.length;
  const promises =
    uploadsForVerification.map((forVerification, index) =>
      checkUrlValidityForUploadItems(forVerification, index, total)
    )

  const results: SelectedUploadItem[] = await Promise.all(promises);

  await bulkUpdateUploadedFlag(results);
  const failures = results.filter((x: SelectedUploadItem) => x?.isValid !== true) || []//accomodates null also   

  const result = {
    successCount: results.length - failures.length,
    failureCount: failures.length,
    status: `Verfification/DB-Marking of Selected (${results.length}) items completed.`,
    note: "Bad Data Upload Failures are not captured yet",
    failures: failures.map(x => x.title),
  };
  console.log(`_res ${result.status} ${result.successCount} ${result.failureCount}`)

  return result
}

export const updadeAllUplodVerfiedFlagInUploadCycle = async (uploadCycleId: string) => {
  const itemsUshered = await getListOfItemsUshered({ uploadCycleId: uploadCycleId.toString() });
  const allTrue = itemsUshered.filter(x => x.uploadFlag === true).length === itemsUshered.length;
  console.log(`allTrue: ${allTrue} ${itemsUshered.length}`)
  try {
    console.log(`allTrue updateOne: ${allTrue}`)
    await UploadCycle.updateOne({ uploadCycleId: uploadCycleId }, { $set: { allUploadVerified: allTrue } });
  }
  catch (error) {
    console.error(error);
  }
}

export const bulkUpdateUploadedFlag = async (usheredUploads: SelectedUploadItem[]) => {
  const operations = usheredUploads.map(obj => ({
    updateOne: {
      filter: { _id: obj.id },
      update: { $set: { uploadFlag: obj.isValid } }
    }
  }));

  await ItemsUshered.bulkWrite(operations);
}

export const handleEachRow = (uploadCycleId: string,
  usheredRow: _.Dictionary<IItemsUshered[]>,
  queuedRow: _.Dictionary<IItemsQueued[]>,
  uploadCycleRow: [any, ...any[]]) => {

  const archiveProfileAndCount: ArchiveProfileAndCount[] = []
  let totalCount = 0
  let dateTimeUploadStarted = null;
  for (const key in usheredRow) {
    const row: IItemsUshered[] = usheredRow[key]
    // console.log(`handleEachRow: ${key}: ${row}`);
    const uploadFlagSuccessCount = row.filter(x => x.uploadFlag === true).length;
    archiveProfileAndCount.push({
      archiveProfile: key,
      count: row.length,
      uploadSuccessCount: uploadFlagSuccessCount
    })
    totalCount += row.length
    if (!dateTimeUploadStarted) {
      dateTimeUploadStarted = row[0]?.datetimeUploadStarted
    }
  }

  const archiveProfileAndCountForQueue: ArchiveProfileAndCount[] = []
  let totalQueueCount = 0
  let dateTimeQueueUploadStarted = null;
  for (const key in queuedRow) {
    const row = queuedRow[key]
    // console.log(`handleEachRow: ${key}: ${row}`);
    archiveProfileAndCountForQueue.push({
      archiveProfile: key,
      count: row.length
    })
    totalQueueCount += row.length
    if (!dateTimeQueueUploadStarted) {
      dateTimeQueueUploadStarted = row[0]?.datetimeUploadStarted
    }
  }

  const uploadCycleData: UploadCycleTableData = {
    uploadCycleId,
    archiveProfileAndCount,
    datetimeUploadStarted: uploadCycleRow[0]?.datetimeUploadStarted,
    totalCount,
    mode: uploadCycleRow[0]?.mode,
    archiveProfileAndCountForQueue,
    totalQueueCount,
    dateTimeQueueUploadStarted,
    countIntended: uploadCycleRow[0]?.uploadCount,
    archiveProfileAndCountIntended: uploadCycleRow[0]?.archiveProfiles,
    allUploadVerified: uploadCycleRow[0]?.allUploadVerified,
    moveToFreeze: uploadCycleRow[0]?.moveToFreeze
  }

  return uploadCycleData;
}


export const getListOfUploadCyclesAndCorrespondingData = async (queryOptions: ItemsListOptionsType) => {
  const usheredItems = await getListOfItemsUshered(queryOptions);
  const queuedItems = await getListOfItemsQueued(queryOptions)
  const uploadCycles = await getListOfUploadCycles(queryOptions);

  const groupedUsheredItems = _.groupBy(usheredItems, function (item: any) {
    return item.uploadCycleId;
  });

  const groupedQueuedItems = _.groupBy(queuedItems, function (item: any) {
    return item.uploadCycleId;
  });

  let groupedUploadCycles = new Map<string, Array<any>>();
  //to mainitain original sort order
  uploadCycles.forEach((item: any) => {
    const key = item.uploadCycleId;
    groupedUploadCycles.set(key, [item]);
  });

  const uploadCycleIdAndData: UploadCycleTableDataDictionary[] = []
  for (const [key, value] of groupedUploadCycles) {
    const usheredRow: IItemsUshered[] = groupedUsheredItems[key];
    const queuedRow: IItemsQueued[] = groupedQueuedItems[key];
    const uploadCycleRow: any = value;

    const groupedByArchiveProfiles: _.Dictionary<IItemsUshered[]> = _.groupBy(usheredRow, function (item: any) {
      return item.archiveProfile;
    });
    const queuedRowGroupedByArchiveProfiles: _.Dictionary<IItemsQueued[]> = _.groupBy(queuedRow, function (item: any) {
      return item.archiveProfile;
    });

    const _cycle_and_profiles = handleEachRow(key, groupedByArchiveProfiles, queuedRowGroupedByArchiveProfiles, uploadCycleRow)

    uploadCycleIdAndData.push({
      uploadCycle: _cycle_and_profiles
    })
  }
  return uploadCycleIdAndData
}