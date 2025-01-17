import { UploadCycle } from "../models/uploadCycle";
import { getLimit } from "../routes/utils";
import { replaceQuotesAndSplit } from "../excelToMongo/Util";
import { UploadCycleListOptionsType } from "../types/listingTypes";

export async function getListOfUploadCycles(queryOptions: UploadCycleListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForUploadCycleListing(queryOptions)
  const items = await UploadCycle.find(mongoOptionsFilter)
    .sort({ datetimeUploadStarted: -1 })
    .limit(limit);
  return items;
}

export async function getLatestUploadCycle() {
  const item = await UploadCycle.findOne({}).sort({ _id: -1 })
  return item?.uploadCycleId || "";
}

export async function getLatestUploadCycleById(uploadCycleId: string) {
  const item = await UploadCycle.findOne({ uploadCycleId: uploadCycleId })
  return item;
}

export async function getUploadCycleById(uploadCycleId: string) {
  const item = await UploadCycle.findOne({ uploadCycleId: uploadCycleId })
  return item;
}

export async function markUploadCycleAsMovedToFreeze(uploadCycleId: string) {
  await UploadCycle.updateOne({ uploadCycleId: uploadCycleId }, { $set: { moveToFreeze: true } });
}


export function setOptionsForUploadCycleListing(queryOptions: UploadCycleListOptionsType) {
  // Empty `filter` means "match all documents"
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate) {
    mongoOptionsFilter = {
      ...mongoOptionsFilter,
      createdAt: {
        $gte: new Date(queryOptions?.startDate),
        $lte: new Date(queryOptions?.endDate),
      },
    };
  }

  if (queryOptions?.ids) {
    const ids: string[] = replaceQuotesAndSplit(queryOptions?.ids)
    console.log(`ids ${ids}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, id: { $in: ids } };
  }

  if (queryOptions?.archiveProfiles) {
    const archiveProfiles: string[] = replaceQuotesAndSplit(queryOptions?.archiveProfiles)
    console.log(`archiveProfiles ${archiveProfiles}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, archiveProfile: { $in: archiveProfiles } };
  }

  if (queryOptions?.uploadCycleId) {
    const uploadCycleIds: string[] = replaceQuotesAndSplit(queryOptions?.uploadCycleId)
    console.log(`uploadCycleIds ${uploadCycleIds}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, uploadCycleId: { $in: uploadCycleIds } };
  }
  mongoOptionsFilter = {
    ...mongoOptionsFilter,
    deleted: { $ne: true }
  };

  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}

