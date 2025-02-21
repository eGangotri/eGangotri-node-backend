import moment from "moment";
import path from "path";
import * as fsPromise from 'fs/promises';
import * as _ from 'lodash';
import { excelToJson, jsonToExcel } from "../../excel/ExcelUtils";
import { GDriveExcelHeaders } from "../types";
import { emptyExcelHeaderObj, linkToFileLocation, linkToTruncatedFileLocation, numPages, thumbnail, titleInGoogleDrive } from "./constants";
import { DD_MM_YYYY_HH_MMFORMAT } from "../../../utils/utils";
import {  createFolderIfNotExistsAsync } from "../../../utils/FileUtils";

const ignoreDiff = true;
const foundItems: string[] = [];
const combineExcels = (mainExcelFileName: string, secondaryExcelFileName: string, combinedExcelFileName: string) => {
    const mainExcelData: GDriveExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: GDriveExcelHeaders[] = excelToJson(secondaryExcelFileName);

    const secondaryExcelDataAdjusted: GDriveExcelHeaders[] = fillPageCount(secondaryExcelData);
    const dataMisMatchDiff = mainExcelData.length - secondaryExcelData.length
    const dataMismatch = dataMisMatchDiff !== 0
    if (dataMismatch) {
        console.log(`Item Length List Mismatch by ${dataMisMatchDiff} :(${mainExcelData.length}!=${secondaryExcelData.length}) being ignored`);
    }

    const subject = `Combining Excel Data: ${mainExcelFileName} and ${secondaryExcelFileName} to ${combinedExcelFileName}`
    if (dataMismatch && !ignoreDiff) {
        console.log(`Cant proceed Data Mismatch`);
        combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
        checkErroneous(mainExcelData);
        return {
            errors: true,
            errMsg: "Data Mismatch",
            subject
        }
    }

    try {
        const combinedExcelJsons = combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
        const getTrueLength = combinedExcelJsons.filter(x => !_.isEmpty(x[linkToFileLocation]))?.length || 0;

        const fileNameWithLength = `${combinedExcelFileName}-${getTrueLength}.xlsx`;
        const _errorsCheck = checkErroneous(mainExcelData)
        const res = jsonToExcel(combinedExcelJsons, fileNameWithLength);

        return {
            ..._errorsCheck,
            ...res,
            subject
        }
    }

    catch (err) {
        console.log(`Error: ${err}`)

        return {
            success: false,
            errors: err,
            subject
        }
    }

}

const checkErroneous = (_excelData: GDriveExcelHeaders[]) => {
    const _erroneous = _excelData.filter(x => !foundItems.includes(x[titleInGoogleDrive]));
    const errMsg = _.isEmpty(_erroneous) ? "" : JSON.stringify(_erroneous.map(x => `${x[titleInGoogleDrive]}`))
    console.log("errorneous items in Main: ", errMsg === "" ? "None" : errMsg);
    return {
        errors: errMsg !== "",
        errMsg

    }
}

const combineExcelJsons = (mainExcelData: GDriveExcelHeaders[], secondaryExcelDataAdjusted: GDriveExcelHeaders[]) => {

    const combinedExcelJsons = mainExcelData.map(x => findCorrespondingExcelHeader(x, secondaryExcelDataAdjusted));

    console.log(`Combining JSON Data: `)
    return [
        emptyExcelHeaderObj,
        emptyExcelHeaderObj,
        ...combinedExcelJsons
    ]
}

const findCorrespondingExcelHeader = (firstExcel: GDriveExcelHeaders, secondaryExcelDataAdjusted: GDriveExcelHeaders[]) => {
    const combinedObject: GDriveExcelHeaders = firstExcel;
    let _titleInGoogleDrivePrimary = firstExcel[titleInGoogleDrive]

    secondaryExcelDataAdjusted?.find((secondExcel: GDriveExcelHeaders) => {
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
            combinedObject[thumbnail] = secondExcel[thumbnail] || "*"
            foundItems.push(secondExcel[titleInGoogleDrive])
            return secondExcel;
        }
    })

    return combinedObject;
}

const fillPageCount = (excelJson: GDriveExcelHeaders[]) => {
    return excelJson.map((row: GDriveExcelHeaders) => {
        const titleWithPageCount = row[titleInGoogleDrive]
        row[titleInGoogleDrive] = titleWithPageCount.slice(0, titleWithPageCount.length - 9) + ".pdf";
        row[numPages] = parseInt(titleWithPageCount.slice(-8, -4))
        return row;
    })
}

const exec = async () => {
    const _root = "C:\\_catalogWork\\_collation";
    const trCount = 60
    const treasureFolder = `Treasures ${trCount}`
    const treasureFolder2 = `Treasures${trCount}`

    const mainExcelPath = `${_root}\\_googleDriveExcels\\${treasureFolder}`;
    const dirContents = await fsPromise.readdir(mainExcelPath);
    const mainExcelFileName = `${mainExcelPath}\\${dirContents[0]}`;

    const secondaryExcelPath = `${_root}\\_catReducedDrivePdfExcels\\${treasureFolder2}`;
    const dirContents2 = await fsPromise.readdir(secondaryExcelPath);
    const secondaryExcelFileName = `${secondaryExcelPath}\\${dirContents2[0]}`;

    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

    const combinedExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`;

    await createFolderIfNotExistsAsync(combinedExcelPath)

    const combinedExcelFileName = `${combinedExcelPath}\\${treasureFolder}-Catalog-${timeComponent}`;

    combineExcels(mainExcelFileName, secondaryExcelFileName, combinedExcelFileName)
}

export const combineGDriveAndReducedPdfExcels = async (mainFilePathAbs: string,
    secondaryFilePathAbs: string,
    destRoot = "C:\\_catalogWork\\_collation") => {
    const terminalFolder = path.basename(path.dirname(mainFilePathAbs));
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

    const combinedExcelPath = `${destRoot}\\_catCombinedExcels\\${terminalFolder}`;
    console.log(`_combinedExcelPath ${combinedExcelPath}`)
    await createFolderIfNotExistsAsync(combinedExcelPath)
    const combinedExcelFileName = `${combinedExcelPath}\\${terminalFolder}-Catalog-${timeComponent}`;

    return combineExcels(mainFilePathAbs, secondaryFilePathAbs, combinedExcelFileName)

};
//exec()
//Combined google drive excel with reduced pdf drive excels
//pnpm run combineExcels

