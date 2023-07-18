import * as XLSX from "xlsx";
import { jsonToExcel } from "./ExcelUtils";
import { ExcelHeaders } from "./types";
import { SHEET_NAME, emptyExcelHeaderObj } from "./constants";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";

const _root = "E:\\_catalogWork\\_collation";
const treasureFolder = "Treasures 19"

const mainExcelPath = `${_root}\\_catExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;

const secondaryExcelPath = `${_root}\\_catReducedPdfExcels\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\${fs.readdirSync(secondaryExcelPath)[0]}`;

const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

const combinedExcelPath = `${_root}\\_catCombinedExcels\\${treasureFolder}`;

if (!fs.existsSync(combinedExcelPath)) {
    fs.mkdirSync(combinedExcelPath);
}
const combinedExcelFileName = `${combinedExcelPath}\\${treasureFolder}-Catalog-${timeComponent}`;


const numPages = "No. of Pages"
const titleInGoogleDrive = "Title in Google Drive"
const linkToFileLocation = "Link to File Location"
const linkToTruncatedFileLocation = "Link to Truncated File Location";
const bookOrManuscript = "Book / Manuscript"

export const combineExcels = () => {
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    const secondaryExcelData: ExcelHeaders[] = excelToJson(secondaryExcelFileName);

    const secondaryExcelDataAdjusted: ExcelHeaders[] = fillPageCount(secondaryExcelData);
    if (mainExcelData.length != secondaryExcelData.length) {
        console.log("Cant proceed Data Length in Main and Secondary dont match");
        //process.exit(0);
    }
    const combinedExcelJsons = combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
    const fileNameWithLengh = `${combinedExcelFileName}-${mainExcelData.length}.xlsx`;

    jsonToExcel(combinedExcelJsons, fileNameWithLengh);
}

const combineExcelJsons = (mainExcelData: ExcelHeaders[], secondaryExcelDataAdjusted: ExcelHeaders[]) => {

    const combinedExcelJsons = mainExcelData.map(x=>findCorrespondingExcelHeader(x,secondaryExcelDataAdjusted));
    console.log(`Combining JSON Data: `)
    return [
        emptyExcelHeaderObj,
        emptyExcelHeaderObj,
        ...combinedExcelJsons
    ]
}

const findCorrespondingExcelHeader = (firstExcel: ExcelHeaders, secondaryExcelDataAdjusted: ExcelHeaders[]) => {
    const combinedObject:ExcelHeaders = firstExcel;
    secondaryExcelDataAdjusted?.find((secondExcel: ExcelHeaders) => {
        if (firstExcel[titleInGoogleDrive] === secondExcel[titleInGoogleDrive]) {
            combinedObject[linkToTruncatedFileLocation] = secondExcel[linkToFileLocation] || "*"
            combinedObject[numPages] = secondExcel[numPages] || "*"
            return secondExcel;
        }
    })
   
    return combinedObject;
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
    console.log(`Converted ${excelName} to Json with Data Length ${jsonData.length}`);
    return jsonData
}

//8-9-10-12-13 done
combineExcels()