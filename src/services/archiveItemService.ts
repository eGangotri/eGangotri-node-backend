import { ArchiveItem } from "../models/ArchiveItem";
import { getLimit } from "../routes/utils";
import { replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { ArchiveItemListOptionsType } from "../types/listingTypes";

export async function getListOfArchiveItems(queryOptions: ArchiveItemListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForArchiveListing(queryOptions)
  const items = await ArchiveItem.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

export function setOptionsForArchiveListing(queryOptions: ArchiveItemListOptionsType) {
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
        ...mongoOptionsFilter, titleArchive: {
          $regex: new RegExp("\\b" + searchTerm + "\\b", "i")
        }
      };
    }
    else {
      mongoOptionsFilter = {
        ...mongoOptionsFilter, titleArchive: {
          $regex: new RegExp(searchTerm, "i")
        }
      }
    }
  }

  if (queryOptions?.archiveProfiles) {
    const archiveProfiles: string[] = replaceQuotesAndSplit(queryOptions?.archiveProfiles)
    console.log(`archiveProfiles ${archiveProfiles}`)
    mongoOptionsFilter = { ...mongoOptionsFilter, archiveProfile: { $in: archiveProfiles } };
  }

  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}

export async function getArchiveItemStatistics() {
    const result = await ArchiveItem.aggregate([
        {
            $group: {
                _id: "$acct",
                totalSize: { $sum: { $toLong: "$size" } },
                totalPageCount: { $sum: { $toInt: "$pageCount" } },
                emailUsers: { $addToSet: "$emailUser" },
                sources: { $addToSet: "$source" },
                firstLowestDate: { $min: "$date" }
            }
        },
        {
            $project: {
                _id: 0,
                acct: "$_id",
                totalSize: 1,
                totalPageCount: 1,
                emailUsers: 1,
                sources: 1,
                firstLowestDate: 1
            }
        }
    ]);

    return result;
}

