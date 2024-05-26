import { getLimit } from "../routes/utils";
import { replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { GDriveItemListOptionsType } from "../types/listingTypes";
import { GDriveItem } from "../models/GDriveItem";
import { excelToJson, jsonToExcel } from "../cliBased/excel/ExcelUtils";
import { folderName, titleInGoogleDrive } from "../cliBased/googleapi/_utils/constants";
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
  const localExcelAsJSONWithExtraneousData = excelToJson(localExcel)

  const localExcelAsJSON = localExcelAsJSONWithExtraneousData.filter((item) => item.absPath?.trim().length > 0)

  console.log(`gDriveExcelAsJSON: ${gDriveExcelAsJSON.length}`)
  console.log(`localExcelAsJSON: ${localExcelAsJSON.length}\n`)
  console.log(`jsonItem count diff: ${localExcelAsJSON.length - gDriveExcelAsJSON.length}\n`)

  console.log(`first gDriveExcelAsJSON: 
         ${gDriveExcelAsJSON[0][titleInGoogleDrive]}`);

  console.log(`first localExcelAsJSON: 
         ${localExcelAsJSON[0]["fileName"]}`);


  const gDriveJsonArrayTitles = gDriveExcelAsJSON.map(row => (row[folderName] + path.sep + row[titleInGoogleDrive]) || "");
  const localExcelAsJSONTitles = localExcelAsJSON.map(row => row["absPath"] || "");
  console.log(`gDriveJsonArrayTitles ${JSON.stringify(gDriveJsonArrayTitles[0])}`);
  console.log(`localExcelAsJSONTitles ${JSON.stringify(localExcelAsJSONTitles[0])}`);

  function myCustomComparator(a: string, b: string) {
    if (a.includes(b)) {
      return true;
    }
    else {
      return false;
    }
  }
  // const diff = _.difference(localExcelAsJSONTitles, gDriveJsonArrayTitles);
  const diff = _.differenceWith(localExcelAsJSONTitles, gDriveJsonArrayTitles, myCustomComparator);
  console.log(`diff ${diff.length} ${diff[0]}`)

  const _forReupload = localExcelAsJSON.filter((item) => {
    return diff.includes(item?.absPath)
  });

  console.log(`_forReupload ${_forReupload.length} ${_forReupload[0]}`);

  const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
  const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
  console.log("diffUpl Length:" + _forReupload.length)
  const excelName = `${folder}GDrive-Integrity-Check-(${_forReupload.length})-${timeComponent}.xlsx`
  jsonToExcel(_forReupload, excelName)

  return {
    diffUplodables: _forReupload.length,
    excelName,
    gDrivePath: gDriveExcel,
    localDrivePath: localExcel,
    localGDriveDiff: `Local has: ${localExcelAsJSON.length} items. GDrive has ${gDriveExcelAsJSON.length} items. Missing ${localExcelAsJSON.length - gDriveExcelAsJSON.length}`,
    excel: `G-Drive-Local Integrity Test Excel ${excelName} created for ${_forReupload.length} missing in G-Drive`,
    msg: `${diff.length} items not found in Local`,
    diff: diff.length > 100 ? "Showing first 100 only. " + diff.slice(0, 100) : diff,
  }
}