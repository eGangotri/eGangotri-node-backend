import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { ExcelHeaders } from '../types';
import { excelToJson, jsonToExcel } from './ExcelUtils';
import {
    author, edition, editor,
    emptyExcelHeaderObj, isbn,
    language, placeOfPubliation,
    publisher, remarks, script,
    subTitle, subject, titleInEnglish,
    titleInGoogleDrive, titleInOriginal,
    yearOfPublication
} from './constants';

const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures"

const mainExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\forMerge\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

const mergedExcelPath = `${_root}\\merged\\${treasureFolder}`;

if (!fs.existsSync(mergedExcelPath)) {
    fs.mkdirSync(mergedExcelPath);
}
const mergedExcelFileName = `${mergedExcelPath}\\${treasureFolder}-Final-Merged-Catalog-${timeComponent}`;

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
        if (_titleInGoogleDrivePrimary === _titleInGoogleDriveSecondary) {
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

const mergeExcels = () => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName, "Published Books");

    if (mainExcelData.length != secondaryExcelData.length) {
        console.log(`Cant proceed Data Length in Main and Secondary (${mainExcelData.length}!=${secondaryExcelData.length})dont match`);
        process.exit(0);
    }

    console.log(`Merge Excel for  ${mainExcelFileName} ${secondaryExcelFileName}started `);
    const _mergedExcelJsons = mergeExcelJsons(mainExcelData, secondaryExcelData);

    const fileNameWithLength = `${mergedExcelFileName}-${mainExcelData.length}.xlsx`;
    jsonToExcel(_mergedExcelJsons, fileNameWithLength);
}

mergeExcels()