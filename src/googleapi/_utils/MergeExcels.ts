import * as fs from 'fs';
import * as _ from 'lodash';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { ExcelHeaders } from '../types';
import { excelToJson, jsonToExcel } from './ExcelUtils';
import {
    author, edition, editor,
    isbn,
    language, placeOfPubliation,
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

const findCorrespondingExcelHeader = (firstExcel: ExcelHeaders, secondaryExcelDataAdjusted: ExcelHeaders[]) => {
    const combinedObject: ExcelHeaders = firstExcel;
    let _titleInGoogleDrivePrimary = firstExcel[titleInGoogleDrive]

    secondaryExcelDataAdjusted?.find((secondExcel: ExcelHeaders) => {
        let _titleInGoogleDriveSecondary = secondExcel[titleInGoogleDrive]
        if (_titleInGoogleDrivePrimary === _titleInGoogleDriveSecondary ||
            (calculateLevenshteinDistance(_titleInGoogleDrivePrimary, _titleInGoogleDriveSecondary))< 2) {
            MATCH_COUNTER++
            combinedObject[titleInEnglish] = secondExcel[titleInEnglish] || "*"
            combinedObject[titleInOriginal] = secondExcel[titleInOriginal] || "*"
            combinedObject[subTitle] = secondExcel[subTitle] || "*"
            combinedObject[author] = secondExcel[author] || "*"
            combinedObject[editor] = secondExcel[editor] || "*"
            combinedObject[language] = secondExcel[language] || "*"
            combinedObject[script] = secondExcel[script] || "*"
            combinedObject[subject] = secondExcel[subject] || "*"
            combinedObject[publisher] = secondExcel[publisher] || "*"
            combinedObject[edition] = secondExcel[edition] || "*"
            combinedObject[placeOfPubliation] = secondExcel[placeOfPubliation] || "*"
            combinedObject[yearOfPublication] = secondExcel[yearOfPublication] || "*"
            combinedObject[isbn] = secondExcel[isbn] || "*"
            combinedObject[remarks] = secondExcel[remarks] || "*"
            return secondExcel;
        }
    })

    return combinedObject;
}

const mergeExcels = (mainExcelFileName: string, secondaryExcelFileName: string) => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName, "Published Books");

    SECONDARY_EXCEL_FILE_TITLE_LIST = secondaryExcelData.map(y => y[titleInGoogleDrive])?.filter(x => !_.isEmpty(x) && x?.length > 0);
    console.log(`${SECONDARY_EXCEL_FILE_TITLE_LIST.length} will be injected from secondary file to the merged file`);
    console.log(`Merge Excel for  ${mainExcelFileName} (${mainExcelData.length}) ${secondaryExcelFileName}(${secondaryExcelData.length}) started `);
    const _mergedExcelJsons = mergeExcelJsons(mainExcelData, secondaryExcelData);

    if (secondaryExcelData.length !== MATCH_COUNTER) {
        console.log(`Matched Items less by  ${secondaryExcelData.length - MATCH_COUNTER}. Cannot proceed`);
        const mergedExcelJsonsTitles = _mergedExcelJsons.map(x => x[titleInGoogleDrive]);
        console.log(`mergedExcelJsonsTitles ${mergedExcelJsonsTitles.length}`);
        const _matchedOnes = mergedExcelJsonsTitles.filter(x => SECONDARY_EXCEL_FILE_TITLE_LIST.includes(x));

        let _missedOnes = _.difference(SECONDARY_EXCEL_FILE_TITLE_LIST, _matchedOnes);
        console.log(`_matchedOnes 
        // ${JSON.stringify(_matchedOnes[0])}
        // ${_matchedOnes.length}
        // ${JSON.stringify(SECONDARY_EXCEL_FILE_TITLE_LIST[0])}
        missed out ${SECONDARY_EXCEL_FILE_TITLE_LIST.length - _matchedOnes.length}
        
        ${_missedOnes.length}
        ${JSON.stringify(_missedOnes)}
        `);
        process.exit(0);
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
let SECONDARY_EXCEL_FILE_TITLE_LIST: string[] = []
const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures"

const mainExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`
const _mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\forMerge\\${treasureFolder}`
const _secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)



mergeExcels(_mainExcelFileName, _secondaryExcelFileName)
function calculateLevenshteinDistance(str1: string, str2: string): number {
    if(_.isEmpty(str1) || _.isEmpty(str2)){
        return 100
    }
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = [];
  
    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      dp[i][0] = i;
    }
  
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
  
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }
  
    return dp[m][n];
  }
  
  const string1 = "Varadambika Parinaya Champu - Tirumalmba.pdf";
  const string2 = "Varadambika Parinaya Champu - XTirumalmba.pdf";
  
  const levenshteinDistance = calculateLevenshteinDistance(string1, string2);
  //console.log(`Levenshtein Distance: ${levenshteinDistance}`);
  