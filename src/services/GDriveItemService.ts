import { getLimit } from "../routes/utils";
import { replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { GDriveItemListOptionsType } from "../types/listingTypes";
import { GDriveItem } from "../models/GDriveItem";

export async function getListOfGDriveItems(queryOptions: GDriveItemListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForGDriveListing(queryOptions)
  const items = await GDriveItem.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

export function setOptionsForGDriveListing(queryOptions: GDriveItemListOptionsType) {
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

  if (queryOptions.searchTerm) {
    const searchTerm: string = replaceQuotes(queryOptions?.searchTerm)
    console.log(`searchTerm ${searchTerm}`)
    if (queryOptions?.wordBoundary) {
      mongoOptionsFilter = {
        ...mongoOptionsFilter, titleGDrive: {
          $regex: new RegExp("\\b" + searchTerm + "\\b", "i")
        }
      };
    }
    else {
      mongoOptionsFilter = {
        ...mongoOptionsFilter, titleGDrive: {
          $regex: new RegExp(searchTerm, "i")
        }
      }
    }
  }
  else {
    console.log(`cannot proceed no searchTerm`);
    throw new Error(`Please provide a searchTerm`);
  }

  if (queryOptions?.archiveProfiles) {
    const archiveProfiles: string[] = replaceQuotesAndSplit(queryOptions?.archiveProfiles)
    console.log(`archiveProfiles ${archiveProfiles}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, archiveProfile: { $in: archiveProfiles } };
  }

  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}

