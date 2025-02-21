import * as fs from 'fs';
import * as _ from 'lodash';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../../utils/utils";
import moment from "moment";
import { GDriveExcelHeaders } from '../types';
import { excelToJson, getGoogleDriveId, jsonToExcel } from '../../excel/ExcelUtils';
import {
  author, edition, editor,
  isbn,
  language, linkToFileLocation, placeOfPubliation,
  publisher, remarks, script,
  subTitle, subject, titleInEnglish,
  titleInGoogleDrive, titleInOriginal,
  yearOfPublication
} from './constants';
import { checkFolderExistsSync, createDirIfNotExistsAsync } from 'utils/FileUtils';

const mergeExcelJsons = (mainExcelData: GDriveExcelHeaders[], secondaryExcelDataAdjusted: GDriveExcelHeaders[]) => {
  const combinedExcelJsons = mainExcelData.map(x => findCorrespondingExcelHeader(x, secondaryExcelDataAdjusted));
  console.log(`Merging JSON Data: `)
  return combinedExcelJsons
}

const findCorrespondingExcelHeader = (firstExcelRow: GDriveExcelHeaders, secondaryExcelDataAdjusted: GDriveExcelHeaders[]) => {
  const combinedObject: GDriveExcelHeaders = firstExcelRow;
  let folderidInGoogleDrivePrimary = getGoogleDriveId(firstExcelRow[linkToFileLocation])
  secondaryExcelDataAdjusted?.find((secondExcelRow: GDriveExcelHeaders) => {
    let folderidInGoogleDriveSecondary = getGoogleDriveId(secondExcelRow[linkToFileLocation])
    if (!_.isEmpty(folderidInGoogleDrivePrimary) && (folderidInGoogleDrivePrimary === folderidInGoogleDriveSecondary)) {
      MATCH_COUNTER++
      combinedObject[titleInEnglish] = secondExcelRow[titleInEnglish] || "*"
      combinedObject[titleInOriginal] = secondExcelRow[titleInOriginal] || "*"
      combinedObject[subTitle] = secondExcelRow[subTitle] || "*"
      combinedObject[author] = secondExcelRow[author] || "*"
      combinedObject[editor] = secondExcelRow[editor] || "*"
      combinedObject[language] = secondExcelRow[language] || "*"
      combinedObject[script] = secondExcelRow[script] || "*"
      combinedObject[subject] = secondExcelRow[subject] || "*"
      combinedObject[publisher] = secondExcelRow[publisher] || "*"
      combinedObject[edition] = secondExcelRow[edition] || "*"
      combinedObject[placeOfPubliation] = secondExcelRow[placeOfPubliation] || "*"
      combinedObject[yearOfPublication] = secondExcelRow[yearOfPublication] || "*"
      combinedObject[isbn] = secondExcelRow[isbn] || "*"
      combinedObject[remarks] = secondExcelRow[remarks] || "*"
      //  console.log(`folderidInGoogleDrivePrimary ${folderidInGoogleDriveSecondary} ${MATCH_COUNTER} ${secondExcelRow[titleInEnglish]}`)
      return secondExcelRow;
    }
  })

  return combinedObject;
}

//deprecated
const mergeExcels = async (mainExcelFileName: string, secondaryExcelFileName: string) => {
  const mainExcelData: GDriveExcelHeaders[] = excelToJson(mainExcelFileName);
  const secondaryExcelData: GDriveExcelHeaders[] = excelToJson(secondaryExcelFileName, "Published Books");

  SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST = secondaryExcelData.map(y => getGoogleDriveId(y[linkToFileLocation]))?.filter(x => !_.isEmpty(x) && x?.length > 0);

  const mainExcelNonEmptyRowCount = mainExcelData.filter(x => !_.isEmpty(x[linkToFileLocation])).length
  console.log(`mainExcelDatas ${mainExcelNonEmptyRowCount}`);
  console.log(`${SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length} will be injected from secondary file to the merged file`);
  console.log(`Merge Excel for ${mainExcelFileName}(${mainExcelNonEmptyRowCount})
              to ${secondaryExcelFileName}(${secondaryExcelData.length}) started `);
  const _mergedExcelJsons = mergeExcelJsons(mainExcelData, secondaryExcelData);

  if (SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length !== MATCH_COUNTER) {
    findErroneous(_mergedExcelJsons)
    //process.exit(0);
  }

  const fileNameWithLength = await createMergedExcelFilePathName(mainExcelNonEmptyRowCount);
  jsonToExcel(_mergedExcelJsons, fileNameWithLength);
}

const findErroneous = (_mergedExcelJsons: GDriveExcelHeaders[]) => {
  console.log(`Mismatch found. identifying .....\nMatched Items ${MATCH_COUNTER}/${SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length}`);

  const mergedExcelJsonFolderIds = _mergedExcelJsons.map(x => getGoogleDriveId(x[linkToFileLocation])).filter(y => !_.isEmpty(y));
  console.log(`mergedExcelJsonFolderIds ${mergedExcelJsonFolderIds.length}`);

  const _matchedOnes = mergedExcelJsonFolderIds.filter(x => SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.includes(x));
  let _missedOnes = _.difference(SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST, _matchedOnes);


  console.log(`_matchedOnes : ${_matchedOnes.length}
      missed out ${(new Set<string>(SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST)).size - _matchedOnes.length}        
      Missed Ones: ${JSON.stringify(_missedOnes)}  ${_missedOnes.length} 
      `);

  const secondListCount = SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length
  const secondListRepeatsRemovedCount = (new Set<string>(SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST)).size
  if (secondListRepeatsRemovedCount === _matchedOnes.length) {
    console.log(`count appears to be different but there are two repeats in SecondaryExcel 
      ${secondListCount} - ${secondListRepeatsRemovedCount} = ${_matchedOnes.length}
      `)
  }
}

const createMergedExcelFilePathName = async (mainExcelDataLength: number) => {
  const mergedExcelPath = `${_root}\\merged\\${treasureFolder}`;

 await createDirIfNotExistsAsync(mergedExcelPath)

  const mergedExcelFileName = `${mergedExcelPath}\\${treasureFolder}-Final-Merged-Catalog-${timeComponent}`;
  return `${mergedExcelFileName}-${mainExcelDataLength}.xlsx`;
}

let MATCH_COUNTER = 0
let SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST: string[] = []
const _root = "C:\\_catalogWork\\_collation";
const treasureFolder = "Treasures-2"

const mainExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`
const _mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\forMerge\\${treasureFolder}`
const _secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

mergeExcels(_mainExcelFileName, _secondaryExcelFileName)
//Caution !!! this is for the Old Excel pre-Google-Drive-Reduced Mechanism to New Mechanism

//pnpm run mergeExcels