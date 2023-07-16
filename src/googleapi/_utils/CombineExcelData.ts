import * as XLSX from "xlsx";
import { jsonToExcel } from "./XlsxUtils";
import { ExcelHeaders } from "./types";
import { SHEET_NAME } from "./constants";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";

const _root = "E:\\tmpReducedPdfs\\_collation";

const treasureFolder = "Treasures"

const mainExcelPath = `${_root}\\_catExcels\\${treasureFolder}`
const mainExcelFileName = `${mainExcelPath}\\Treasures-1G6A8zbbiLHFlqgNnPosq1q6JbOoI2dI--16-Jul-2023-16-02 (2674 items).xlsx`;

const secondaryExcelPath = `${_root}\\_catReducedPdfExcels\\${treasureFolder}`
const secondaryExcelFileName = `${secondaryExcelPath}\\Treasures-1A61-czz5acFuHPrP_gw8hIxnrZ56Itex-16-Jul-2023-22-06.xlsx`;

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

    const secondaryExcelDataAdjusted: ExcelHeaders[] = fillPageCountAndTruncatedLink(secondaryExcelData);
    console.log(`secondaryExcelDataAdjusted: ${JSON.stringify(secondaryExcelDataAdjusted[0])}`);

    if (mainExcelData.length != secondaryExcelData.length) {
        console.log("Cant proceed Data Length in Main and Secondary dont match");
        //process.exit(0);
    }
    const combinedExcelJsons = combineExcelJsons(mainExcelData, secondaryExcelDataAdjusted)
    console.log(`combinedExcelJsons ${JSON.stringify(combinedExcelJsons[0])}`);

    jsonToExcel(combinedExcelJsons, combinedExcelFileName);
}

const combineExcelJsons = (mainExcelData: ExcelHeaders[], secondaryExcelDataAdjusted: ExcelHeaders[]) => {
    const combinedExcelJsons = mainExcelData.map((firstExcel: ExcelHeaders) => {
        const combinedObject = firstExcel;
        secondaryExcelDataAdjusted.find((secondExcel: ExcelHeaders) => {
            if (secondExcel[titleInGoogleDrive] === firstExcel[titleInGoogleDrive])
                return secondExcel;
        });
        combinedObject[numPages] = secondaryExcelDataAdjusted[0][numPages] || "0"
        combinedObject[linkToTruncatedFileLocation] = secondaryExcelDataAdjusted[0][linkToFileLocation] || "0"

        return combinedObject;
    });
    return combinedExcelJsons
}

const fillPageCountAndTruncatedLink = (excelJson: ExcelHeaders[]) => {
    return excelJson.map((row: ExcelHeaders) => {
        const titleWithPageCount = row["Title in Google Drive"]
        row[titleInGoogleDrive] = titleWithPageCount.slice(0, titleWithPageCount.length - 9);
        row[numPages] = parseInt(titleWithPageCount.slice(-8, -4)).toString();
        row[linkToTruncatedFileLocation] = row[linkToFileLocation];
        return row;
    })
}

export const excelToJson = (excelName: string) => {
    const workbook = XLSX.readFile(excelName);
    const sheet = workbook.Sheets[SHEET_NAME];
    const jsonData: ExcelHeaders[] = XLSX.utils.sheet_to_json(sheet);
    console.log(`Json Data Length ${jsonData.length}`);
    console.log(`Json Data Item 1 ${JSON.stringify(jsonData[0])}`);
    return jsonData
}

combineExcels()