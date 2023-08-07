import { excelToJson, jsonToExcel } from "./ExcelUtils";
import { ExcelHeaders } from "../types";
import { emptyExcelHeaderObj, linkToFileLocation, linkToTruncatedFileLocation, numPages, titleInGoogleDrive } from "./constants";
import * as fs from 'fs';
import * as _ from 'lodash';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";

const _root = "C:\\_catalogWork\\_collation";
const treasureFolder = "Treasures 21"

const mainExcelPath = `${_root}\\_googleDriveExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\_catReducedPdfExcels\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

const combinedExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`;

if (!fs.existsSync(combinedExcelPath)) {
    fs.mkdirSync(combinedExcelPath);
}
const combinedExcelFileName = `${combinedExcelPath}\\${treasureFolder}-Catalog-${timeComponent}`;

const foundItems: string[] = [];
const combineExcels = () => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName);

    const secondaryExcelDataAdjusted: ExcelHeaders[] = fillPageCount(secondaryExcelData);
    if (mainExcelData.length != secondaryExcelData.length) {
        console.log(`Cant proceed Data Length in Main and Secondary (${mainExcelData.length}!=${secondaryExcelData.length})dont match`);
        combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
        checkErroneous(mainExcelData);
        process.exit(0);
    }


    const combinedExcelJsons = combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
    const getTrueLength = combinedExcelJsons.filter(x => !_.isEmpty(x[linkToFileLocation]))?.length || 0;

    const fileNameWithLength = `${combinedExcelFileName}-${getTrueLength}.xlsx`;
    checkErroneous(mainExcelData)
    jsonToExcel(combinedExcelJsons, fileNameWithLength);
}

const checkErroneous = (_excelData: ExcelHeaders[]) => {
    const _erroneous = _excelData.filter(x => !foundItems.includes(x[titleInGoogleDrive]));
    console.log("errorneous items in Main", JSON.stringify(_erroneous.map(x => `${x[titleInGoogleDrive]}`)));
}

const combineExcelJsons = (mainExcelData: ExcelHeaders[], secondaryExcelDataAdjusted: ExcelHeaders[]) => {

    const combinedExcelJsons = mainExcelData.map(x => findCorrespondingExcelHeader(x, secondaryExcelDataAdjusted));

    console.log(`Combining JSON Data: `)
    return [
        emptyExcelHeaderObj,
        emptyExcelHeaderObj,
        ...combinedExcelJsons
    ]
}

const findCorrespondingExcelHeader = (firstExcel: ExcelHeaders, secondaryExcelDataAdjusted: ExcelHeaders[]) => {
    const combinedObject: ExcelHeaders = firstExcel;
    let _titleInGoogleDrivePrimary = firstExcel[titleInGoogleDrive]

    secondaryExcelDataAdjusted?.find((secondExcel: ExcelHeaders) => {
        let _titleInGoogleDriveSecondary = secondExcel[titleInGoogleDrive]
        /*if (_titleInGoogleDriveSecondary.length > MAX_FILE_NAME_LENGTH) {
            _titleInGoogleDriveSecondary = _titleInGoogleDriveSecondary.slice(0, MAX_FILE_NAME_LENGTH)
        }
        if (_titleInGoogleDrivePrimary.length > MAX_FILE_NAME_LENGTH) {
            _titleInGoogleDrivePrimary = _titleInGoogleDrivePrimary.slice(0, MAX_FILE_NAME_LENGTH)
        }

        if((_titleInGoogleDrivePrimary.length > MAX_FILE_NAME_LENGTH-1) &&
        (_titleInGoogleDriveSecondary.length > MAX_FILE_NAME_LENGTH-1)){
            console.log(`_titleInGoogleDriveSecondary ${_titleInGoogleDriveSecondary}`)
            console.log(`_titleInGoogleDrivePrimary ${_titleInGoogleDrivePrimary}`)
            console.log(`_titleInGoogleDrivePrimary === _titleInGoogleDriveSecondary ${_titleInGoogleDrivePrimary === _titleInGoogleDriveSecondary}`)
         }*/

        if (_titleInGoogleDrivePrimary === _titleInGoogleDriveSecondary) {
            combinedObject[linkToTruncatedFileLocation] = secondExcel[linkToFileLocation] || "*"
            combinedObject[numPages] = secondExcel[numPages] || "*"
            foundItems.push(secondExcel[titleInGoogleDrive])
            return secondExcel;
        }
    })

    return combinedObject;
}

const fillPageCount = (excelJson: ExcelHeaders[]) => {
    return excelJson.map((row: ExcelHeaders) => {
        const titleWithPageCount = row[titleInGoogleDrive]
        row[titleInGoogleDrive] = titleWithPageCount.slice(0, titleWithPageCount.length - 9) + ".pdf";
        row[numPages] = parseInt(titleWithPageCount.slice(-8, -4))
        return row;
    })
}

combineExcels()
//yarn run combineExcels