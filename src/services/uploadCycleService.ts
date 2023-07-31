import { UploadCycle } from "../models/uploadCycle";
import { getLimit } from "../routes/utils";
import { replaceQuotesAndSplit } from "./Util";
import { UploadCycleListOptionsType } from "./types";

export async function getListOfUploadCycles(queryOptions: UploadCycleListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForUploadCycleListing(queryOptions)
  const items = await UploadCycle.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

export function setOptionsForUploadCycleListing(queryOptions: UploadCycleListOptionsType) {
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

  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}

