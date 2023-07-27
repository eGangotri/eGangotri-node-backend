import * as fs from 'fs';
import * as _ from 'lodash';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { ExcelHeaders } from '../types';
import { excelToJson, getGoogleDriveId, jsonToExcel } from './ExcelUtils';
import {
  author, edition, editor,
  isbn,
  language, linkToFileLocation, placeOfPubliation,
  publisher, remarks, script,
  subTitle, subject, titleInEnglish,
  titleInGoogleDrive, titleInOriginal,
  yearOfPublication
} from './constants';

const mergeExcelJsons = (mainExcelData: ExcelHeaders[], secondaryExcelDataAdjusted: ExcelHeaders[]) => {
  const combinedExcelJsons = mainExcelData.map(x => findCorrespondingExcelHeader(x, secondaryExcelDataAdjusted));
  console.log(`Combining JSON Data: `)
  return combinedExcelJsons
}

const findCorrespondingExcelHeader = (firstExcelRow: ExcelHeaders, secondaryExcelDataAdjusted: ExcelHeaders[]) => {
  const combinedObject: ExcelHeaders = firstExcelRow;
  let folderidInGoogleDrivePrimary = getGoogleDriveId(firstExcelRow[linkToFileLocation])
  secondaryExcelDataAdjusted?.find((secondExcelRow: ExcelHeaders) => {
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

const mergeExcels = (mainExcelFileName: string, secondaryExcelFileName: string) => {
  const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
  const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName, "Published Books");

  SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST = secondaryExcelData.map(y => getGoogleDriveId(y[linkToFileLocation]))?.filter(x => !_.isEmpty(x) && x?.length > 0);
  console.log(`${SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length} will be injected from secondary file to the merged file`);
  console.log(`Merge Excel for ${mainExcelFileName} (${mainExcelData.length}) ${secondaryExcelFileName}(${secondaryExcelData.length}) started `);
  const _mergedExcelJsons = mergeExcelJsons(mainExcelData, secondaryExcelData);

  if (secondaryExcelData.length !== MATCH_COUNTER) {
    console.log(`mainExcelDatas ${ mainExcelData.length} ( includes 2 empty rows)`);
    console.log(`Matched Items ${ MATCH_COUNTER}/${SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length}`);

    const mergedExcelJsonFolderIds = _mergedExcelJsons.map(x => getGoogleDriveId(x[linkToFileLocation])).filter(y=>!_.isEmpty(y));
    console.log(`mergedExcelJsonFolderIds ${mergedExcelJsonFolderIds.length}`);
 
    const _matchedOnes = mergedExcelJsonFolderIds.filter(x => SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.includes(x));
    let _missedOnes = _.difference(SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST, _matchedOnes);
    let _missedOnes2 = _.difference(_matchedOnes, SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST);

    console.log(`_matchedOnes 
        ${_matchedOnes.length}
        missed out ${SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST.length - _matchedOnes.length}        
        ${_missedOnes.length} ${_missedOnes2.length}
        Missed Ones: ${JSON.stringify(_missedOnes)} ${JSON.stringify(_missedOnes2)}
        `);
    //process.exit(0);
  }

  const fileNameWithLength = createMergedExcelFilePathName(mainExcelData.length);
  jsonToExcel(_mergedExcelJsons, fileNameWithLength);
}

const createMergedExcelFilePathName = (mainExcelDataLength: number) => {
  const mergedExcelPath = `${_root}\\merged\\${treasureFolder}`;

  if (!fs.existsSync(mergedExcelPath)) {
    fs.mkdirSync(mergedExcelPath);
  }
  const mergedExcelFileName = `${mergedExcelPath}\\${treasureFolder}-Final-Merged-Catalog-${timeComponent}`;
  return `${mergedExcelFileName}-${mainExcelDataLength}.xlsx`;
}

let MATCH_COUNTER = 0
let SECONDARY_EXCEL_GOOGLE_FOLDER_IDS_LIST: string[] = []
const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures"

const mainExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`
const _mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\forMerge\\${treasureFolder}`
const _secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

mergeExcels(_mainExcelFileName, _secondaryExcelFileName)
