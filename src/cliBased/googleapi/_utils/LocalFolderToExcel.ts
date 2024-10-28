import path from "path";
import * as FileUtils from "../../../utils/FileStatsUtils";
import * as FileConstsUtils from "../../../utils/constants";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../../utils/utils";
import moment from "moment";
import { jsonToExcel } from "../../excel/ExcelUtils";
import * as _ from 'lodash';
import { FileStats } from "../../../imgToPdf/utils/types";
import { addSummaryToExcel, createMetadata } from "excelToMongo/Util";
import os from "os";

export const createExcelFilePathName = (mainExcelDataLength: number, folderName: String, _excelRoot: string, suffix: string) => {
    const _excelPath = `${_excelRoot}\\local`;

    if (!fs.existsSync(_excelPath)) {
        fs.mkdirSync(_excelPath);
    }
    const excelPathWithFolderName = `${_excelPath}\\${folderName}`;

    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    if (!fs.existsSync(excelPathWithFolderName)) {
        fs.mkdirSync(excelPathWithFolderName);
    }
    const mergedExcelFileName = `${excelPathWithFolderName}\\${folderName}${timeComponent}-${suffix}`;
    return `${mergedExcelFileName}-${mainExcelDataLength}.xlsx`;
}

const folderToExcel = async (folder: string, _excelRoot: string) => {
    console.log(`folderToExcel ${folder}`);
    FileConstsUtils.incrementRowCounter()
    const jsonArray: FileStats[] = await FileUtils.getAllPDFFilesWithMedata(folder, true)
    const { totalFileCount, totalPageCount, totalSizeRaw } = createMetadata(jsonArray);
    addSummaryToExcel(jsonArray, totalFileCount, totalPageCount, totalSizeRaw);
    const _fileName = createExcelFilePathName(jsonArray.length, path.parse(folder)?.base, _excelRoot, "-Final-Merged-Catalog-");
    jsonToExcel(jsonArray, _fileName)
}


(async () => {
    const _excelRoot = "C:\\_catalogWork\\_collation";
    const localRoot = "G:\\eGangotri-Tr-31-39"

    const localSubFolder: string[] = [] //[31, 32, 33, 34, 35, 36, 37,38,39].map(x => `Treasures${x}`);
    const homeDirectory = os.homedir();

    await folderToExcel(`${homeDirectory}\\Documents\\_testPDF`, `${homeDirectory}\\Documents`);

    for (let folder of localSubFolder) {
        try {
            await folderToExcel(`${localRoot}\\${folder}`, _excelRoot);
        }
        catch (err) {
            console.log(err, "foderToExcel")
        }
    }
})();
console.log("Dont use this. use the Groovy Version as this wont work for files over 2 GB")
//pnpm run localToExcel