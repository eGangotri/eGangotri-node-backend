import { getLimit } from "../routes/utils";
import { replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { GDriveItemListOptionsType } from "../types/listingTypes";
import { GDriveItem } from "../models/GDriveItem";
import { excelToJson, jsonToExcel } from "../cliBased/excel/ExcelUtils";
import { folderName, titleInGoogleDrive } from "../cliBased/googleapi/_utils/constants";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";

import moment from "moment";
import path from "path";
import _, { String } from "lodash";
import { downloadFileFromGoogleDrive } from "cliBased/pdf/downloadPdf";
import { GDriveExcelData, GDriveExcelHeaders } from "cliBased/googleapi/types";

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

  console.log(`_forReupload ${_forReupload.length} ${JSON.stringify(_forReupload[0])}`);

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

function convertToGDriveExcelLinkData(json: any): GDriveExcelData {
  return {
    sNo: json["S.No"],
    titleInGoogleDrive: json["Title in Google Drive"],
    linkToFileLocation: json["Link to File Location"],
    linkToTruncatedFileLocation: json["Link to Truncated File Location"],
    bookManuscript: json["Book / Manuscript"],
    titleInEnglish: json["Title in English"],
    titleInOriginalScriptDevanagariEtc: json["Title in Original Script ( Devanagari etc )"],
    subTitle: json["Sub-Title"],
    author: json["Author"],
    commentatorTranslatorEditor: json["Commentator/ Translator/Editor"],
    languages: json["Language(s)"],
    script: json["Script"],
    subjectDescriptor: json["Subject/ Descriptor"],
    publisher: json["Publisher"],
    editionStatement: json["Edition/Statement"],
    placeOfPublication: json["Place of Publication"],
    yearOfPublication: json["Year of Publication"],
    noOfPages: json["No. of Pages"],
    isbn: json["ISBN"],
    remarks: json["Remarks"],
    commentairies: json["Commentairies"],
    commentator: json["Commentator"],
    seriesKstsKavyamalaChowkhambaEtc: json["Series ( KSTS/Kavyamala/Chowkhamba etc"],
    sizeWithUnits: json["Size with Units"],
    sizeInBytes: json["Size in Bytes"],
    folderName: json["Folder Name"],
    thumbnail: json["Thumbnail"],
    createdTime: json["Created Time"]
  }
}

export const convertGDriveExcelToLinkData =
  (gDriveExcelPath: string): GDriveExcelData[] => {
    const _excelAsJson = excelToJson(gDriveExcelPath);
    console.log(`downloadArchiveItemsViaExcel: ${_excelAsJson.length} 
      (${JSON.stringify(_excelAsJson[0])}) items found in ${gDriveExcelPath}`);

    const _gDriveLinkData: GDriveExcelData[] = _excelAsJson.map(_json => convertToGDriveExcelLinkData(_json));
    console.log(`converted to linkData: ${_gDriveLinkData.length} 
       (${JSON.stringify(_gDriveLinkData[0])})
      items found in ${gDriveExcelPath}`);
    return _gDriveLinkData;
  }


// export const downloadGDriveData = async (googleDriveData:any[],
//   pdfDumpFolder:string
// ) => {
//   const promises = googleDriveData.map(_data => {
//     console.log(`_data: ${JSON.stringify(_data)}}`);
//     const pdfDumpWithPathAppended = pdfDumpFolder + path.sep + _data.parents;
//     console.log(`pdfDumpWithPathAppended: ${pdfDumpWithPathAppended}`);
//     if (!fs.existsSync(pdfDumpWithPathAppended)) {
//       fsExtra.ensureDirSync(pdfDumpWithPathAppended);
//     }

//     return downloadFileFromGoogleDrive(_data.googleDriveLink,
//       pdfDumpWithPathAppended, _data.fileName, dataLength, _data?.fileSizeRaw)
//   });
//   const results = await Promise.all(promises);
//   return results
// }