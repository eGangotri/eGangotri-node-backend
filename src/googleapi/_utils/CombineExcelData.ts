import * as XLSX from "xlsx";
import { jsonToExcel } from "./ExcelUtils";
import { ExcelHeaders } from "./types";
import { SHEET_NAME, emptyExcelHeaderObj } from "./constants";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";

const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures 2"

const mainExcelPath = `${_root}\\_catExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\Treasures 2-1CuXlQEPC06pYPo9QxcgtblJWUETfE1T7-17-Jul-2023-04-21_692.xlsx`;

const secondaryExcelPath = `${_root}\\_catReducedPdfExcels\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\Treasures-2-1Nlcx96VxWbOeR13fkJS1KvcS0lf3bhxv-17-Jul-2023-04-10_692.xlsx`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

const combinedExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`;
if (!fs.existsSync(combinedExcelPath)) {
    fs.mkdirSync(combinedExcelPath);
}
const combinedExcelFileName = `${combinedExcelPath}\\${treasureFolder}-Catalog-${timeComponent}.xlsx`;


const numPages = "No. of Pages"
const titleInGoogleDrive = "Title in Google Drive"
const linkToFileLocation = "Link to File Location"
const linkToTruncatedFileLocation = "Link to Truncated File Location";

export const combineExcels = () => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName);

    const secondaryExcelDataAdjusted: ExcelHeaders[] = fillPageCount(secondaryExcelData);

    if (mainExcelData.length != secondaryExcelData.length) {
        console.log("Cant proceed Data Length in Main and Secondary dont match");
        //process.exit(0);
    }
    const combinedExcelJsons = combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)

    jsonToExcel(combinedExcelJsons, combinedExcelFileName);
}

const combineExcelJsons = (mainExcelData: ExcelHeaders[], secondaryExcelDataAdjusted: ExcelHeaders[]) => {
    const combinedExcelJsons = mainExcelData.map((firstExcel: ExcelHeaders) => {
        const combinedObject = firstExcel;
        secondaryExcelDataAdjusted?.find((secondExcel: ExcelHeaders) => {
            if (firstExcel[titleInGoogleDrive] === secondExcel[titleInGoogleDrive]) {
                combinedObject[linkToTruncatedFileLocation] = secondExcel[linkToFileLocation] || "*"
                combinedObject[numPages] = secondExcel[numPages] || "*"
                return secondExcel;
            }
        })
       
        return combinedObject;
    });

    return [
        emptyExcelHeaderObj,
        emptyExcelHeaderObj,
        ...combinedExcelJsons
    ]
}

const fillPageCount = (excelJson: ExcelHeaders[]) => {
    return excelJson.map((row: ExcelHeaders) => {
        const titleWithPageCount = row["Title in Google Drive"]
        row[titleInGoogleDrive] = titleWithPageCount.slice(0, titleWithPageCount.length - 9) + ".pdf";
        row[numPages] = parseInt(titleWithPageCount.slice(-8, -4))
        return row;
    })
}

export const excelToJson = (excelName: string) => {
    const workbook = XLSX.readFile(excelName);
    const sheet = workbook.Sheets[SHEET_NAME];
    const jsonData: ExcelHeaders[] = XLSX.utils.sheet_to_json(sheet);
    console.log(`Json Data Length ${jsonData.length}`);
    return jsonData
}

combineExcels()