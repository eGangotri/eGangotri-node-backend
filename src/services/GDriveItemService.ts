import { getLimit } from "../routes/utils";
import { replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { GDriveItemListOptionsType } from "../types/listingTypes";
import { GDriveItem } from "../models/GDriveItem";
import { excelToJson, jsonToExcel } from "../cliBased/excel/ExcelUtils";
import { titleInGoogleDrive } from "../cliBased/googleapi/_utils/constants";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";

import moment from "moment";
import path from "path";
import _ from "lodash";

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

export const getDiffBetweenGDriveAndLocalFiles = (gDriveExcel: string, localExcel: string) => {
  const gDriveExcelAsJSON = excelToJson(gDriveExcel)
  const localExcelAsJSON = excelToJson(localExcel)

  console.log(`gDriveExcelAsJSON: ${gDriveExcelAsJSON.length}`)
  console.log(`localExcelAsJSON: ${localExcelAsJSON.length}\n`)
  console.log(`jsonItem count diff: ${localExcelAsJSON.length - gDriveExcelAsJSON.length}\n`)

  console.log(`first gDriveExcelAsJSON: 
         ${gDriveExcelAsJSON[0][titleInGoogleDrive]}`);

  console.log(`first localExcelAsJSON: 
         ${localExcelAsJSON[0]["fileName"]}`);


  const gDriveJsonArrayTitles = gDriveExcelAsJSON.map(x => x[titleInGoogleDrive] || "");
  const localExcelAsJSONTitles = localExcelAsJSON.map(x => x["fileName"] || "");

  const diff = _.difference(localExcelAsJSONTitles, gDriveJsonArrayTitles);
  console.log(`diff ${diff.length} ${diff[0]}`)

  const _forReupload = localExcelAsJSON.filter((item) => {
    return diff.includes(item.fileName)
  });

  console.log(`diffUplodables ${_forReupload.length} ${_forReupload[0]}`);

  const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
  const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
  console.log("diffUpl Length" + _forReupload.length)
  const excelName = `${folder}GDrive-Integrity-Check-(${_forReupload.length})-${timeComponent}.xlsx`
  jsonToExcel(_forReupload, excelName)

  return {
    diffUplodables: _forReupload.length,
    excelName,
    excel: `G-Drive-Local Integrity Test Excel ${excelName} created for ${_forReupload.length} missing in G-Drive`,
    msg: `${diff.length} items not found in Local`,
    diff,
  }
}