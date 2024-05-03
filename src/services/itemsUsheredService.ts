import { ArchiveProfileAndCount, SelectedUploadItem, UploadCycleTableData } from "../mirror/types";
import { ItemsUshered } from "../models/itemsUshered";
import { setOptionsForItemListing } from "./dbService";
import { ItemsListOptionsType } from "./types";
import { checkUrlValidityForUploadItems } from "../utils/utils";
import * as _ from 'lodash';
import { UploadCycle } from "../models/uploadCycle";
import { ObjectId } from "mongoose";

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
      isValid: true
    });
    results.push(res);
  }
  await bulkUpdateUploadedFlag(results);
  await updadeAllUplodVerfiedFlagInUploadCycle(uploadCycleIdForVerification);
  const _profilesAsSet = _.uniq(itemsUshered.map(x => x.archiveProfile))
  console.log(`_profilesAsSet: ${JSON.stringify(_profilesAsSet)}`)
  const archiveProfiles = `(${_profilesAsSet})`;
  return [results, archiveProfiles];
}

export const selectedItemsVerficationAndDBFlagUpdate = async (uploadsForVerification: SelectedUploadItem[]) => {
  const results: SelectedUploadItem[] = [];

  for (const forVerification of uploadsForVerification) {
    const res = await checkUrlValidityForUploadItems(forVerification);
    results.push(res);
  }
  await bulkUpdateUploadedFlag(results);
  return results;
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
