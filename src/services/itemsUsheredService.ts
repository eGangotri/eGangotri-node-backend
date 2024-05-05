import { ArchiveProfileAndCount, SelectedUploadItem, UploadCycleTableData, UploadCycleTableDataDictionary } from "../mirror/types";
import { ItemsUshered } from "../models/itemsUshered";
import { setOptionsForItemListing } from "./dbService";
import { ItemsListOptionsType } from "./types";
import { checkUrlValidityForUploadItems } from "../utils/utils";
import * as _ from 'lodash';
import { UploadCycle } from "../models/uploadCycle";
import { ObjectId } from "mongoose";
import { getListOfItemsQueued } from "./itemsQueuedService";
import { getListOfUploadCycles } from "./uploadCycleService";

export async function getListOfItemsUshered(queryOptions: ItemsListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForItemListing(queryOptions)
  const items = await ItemsUshered.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

export const itemsUsheredVerficationAndDBFlagUpdate = async (uploadCycleIdForVerification: string) => {
  //get all Items_Ushered for uploadCycleIdForVerification
  const itemsUshered = await getListOfItemsUshered({ uploadCycleId: uploadCycleIdForVerification });
  const results: SelectedUploadItem[] = [];
  for (const item of itemsUshered) {
    const res = await checkUrlValidityForUploadItems({
      id: item._id,
      archiveId: `${item.archiveItemId}`,
      isValid: true,
      title: item.title
    });
    results.push(res);
  }
  await bulkUpdateUploadedFlag(results);
  await updadeAllUplodVerfiedFlagInUploadCycle(uploadCycleIdForVerification);
  const _profilesAsSet = _.uniq(itemsUshered.map(x => x.archiveProfile))
  console.log(`_profilesAsSet: ${JSON.stringify(_profilesAsSet)}`)
  const archiveProfiles = `(${_profilesAsSet})`;
  const failures = results.filter((x:SelectedUploadItem) => x?.isValid !== true);//accomodates null also   
  return {
    successCount: results.length - failures.length,
    failureCount: failures.length,
    status: `Verfification/DB-Marking of (${results.length}) items for  ${uploadCycleIdForVerification} ${archiveProfiles} completed.`,
    failures:failures.map(x => x.title),
  };
}

export const selectedItemsVerficationAndDBFlagUpdate = async (uploadsForVerification: SelectedUploadItem[]) => {
  const results: SelectedUploadItem[] = [];

  for (const forVerification of uploadsForVerification) {
    const res = await checkUrlValidityForUploadItems(forVerification);
    results.push(res);
  }
  await bulkUpdateUploadedFlag(results);
  const failures = results.filter((x:SelectedUploadItem) => x?.isValid !== true) || []//accomodates null also   

  return {
    successCount: results.length - failures.length,
    failureCount: failures.length,
    status: `Verfification/DB-Marking of Selected (${results.length}) items completed.`,
    failures:failures.map(x => x.title)
  };
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
  usheredRow: _.Dictionary<UploadCycleTableData[]>,
  queuedRow: _.Dictionary<UploadCycleTableData[]>,
  uploadCycleRow: [any, ...any[]]) => {

  const archiveProfileAndCount: ArchiveProfileAndCount[] = []
  let totalCount = 0
  let dateTimeUploadStarted = new Date();
  for (const key in usheredRow) {
    const row = usheredRow[key]
    // console.log(`handleEachRow: ${key}: ${row}`);
    archiveProfileAndCount.push({
      archiveProfile: key,
      count: row.length
    })
    totalCount += row.length
    dateTimeUploadStarted = row[0]?.datetimeUploadStarted
  }

  const archiveProfileAndCountForQueue: ArchiveProfileAndCount[] = []
  let totalQueueCount = 0
  let dateTimeQueueUploadStarted = new Date();
  for (const key in queuedRow) {
    const row = queuedRow[key]
    // console.log(`handleEachRow: ${key}: ${row}`);
    archiveProfileAndCountForQueue.push({
      archiveProfile: key,
      count: row.length
    })
    totalQueueCount += row.length
    dateTimeQueueUploadStarted = row[0]?.datetimeUploadStarted
  }


  const uploadCycleData: UploadCycleTableData = {
    uploadCycleId,
    archiveProfileAndCount,
    datetimeUploadStarted: dateTimeUploadStarted,
    totalCount,
    archiveProfileAndCountForQueue,
    totalQueueCount,
    dateTimeQueueUploadStarted,
    countIntended: _.isEmpty(uploadCycleRow) ? 0 : uploadCycleRow[0]?.uploadCount,
    archiveProfileAndCountIntended: _.isEmpty(uploadCycleRow) ? [] : uploadCycleRow[0]?.archiveProfiles,
    allUploadVerified: _.isEmpty(uploadCycleRow) ? null : uploadCycleRow[0]?.allUploadVerified
  }

  return uploadCycleData;
}


export const getListOfUploadCyclesAndCorrespondingData = async (queryOptions: ItemsListOptionsType) => {
  const items = await getListOfItemsUshered(queryOptions);
  const queuedItems = await getListOfItemsQueued(queryOptions)
  const uploadCycles = await getListOfUploadCycles(queryOptions)
  console.log(`getListOfUploadCyclesAndCorrespondingData: ${JSON.stringify(queryOptions)}`)
  console.log(`getListOfUploadCyclesAndCorrespondingData(${uploadCycles.length}): ${JSON.stringify(uploadCycles.map(x => x.uploadCycleId))}`)

  const groupedItems = _.groupBy(items, function (item: any) {
    return item.uploadCycleId;
  });

  const groupedQueuedItems = _.groupBy(queuedItems, function (item: any) {
    return item.uploadCycleId;
  });

  const groupedUploadCycles = _.groupBy(uploadCycles, function (item: any) {
    return item.uploadCycleId;
  });

  const uploadCycleIdAndData: UploadCycleTableDataDictionary[] = []
  for (const key in groupedItems) {
    const usheredRow = groupedItems[key]
    const queuedRow = groupedQueuedItems[key];
    const uploadCycleRow: any = groupedUploadCycles[key];

    const groupedByArchiveProfiles = _.groupBy(usheredRow, function (item: any) {
      return item.archiveProfile; 
    });
    const queuedRowGroupedByArchiveProfiles = _.groupBy(queuedRow, function (item: any) {
      return item.archiveProfile;
    });

    const _cycle_and_profiles = handleEachRow(key, groupedByArchiveProfiles, queuedRowGroupedByArchiveProfiles, uploadCycleRow)

    uploadCycleIdAndData.push({
      uploadCycle: _cycle_and_profiles
    })
  }
  console.log(`getListOfUploadCyclesAndCorrespondingData: ${JSON.stringify(uploadCycleIdAndData.length)}`)
  console.log(`upcanddata: ${JSON.stringify(uploadCycleIdAndData.map(uploadCycles => uploadCycles.uploadCycle.uploadCycleId))}`);
  return uploadCycleIdAndData
}