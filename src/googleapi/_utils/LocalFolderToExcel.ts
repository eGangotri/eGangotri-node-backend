import path from "path";
import * as FileUtils from "../../imgToPdf/utils/FileUtils";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { jsonToExcel } from "./ExcelUtils";

const createExcelFilePathName = (mainExcelDataLength: number, folderName: String, _excelRoot: string) => {
    const _excelPath = `${_excelRoot}\\local`;

    if (!fs.existsSync(_excelPath)) {
        fs.mkdirSync(_excelPath);
    }
    const excelPathWithFolderName = `${_excelPath}\\${folderName}`;

    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    if (!fs.existsSync(excelPathWithFolderName)) {
        fs.mkdirSync(excelPathWithFolderName);
    }
    const mergedExcelFileName = `${excelPathWithFolderName}\\${folderName}-Final-Merged-Catalog-${timeComponent}`;
    return `${mergedExcelFileName}-${mainExcelDataLength}.xlsx`;
}

const folderToExcel = async (folder: string, _excelRoot: string) => {
    console.log(`folderToExcel ${folder}`)
    FileUtils.incrementRowCounter()
    const jsonArray = await FileUtils.getAllPDFFilesWithMedata(folder)
    const _fileName = createExcelFilePathName(jsonArray.length, path.parse(folder)?.base, _excelRoot);
    jsonToExcel(jsonArray, _fileName)
}


(async () => {
    const _excelRoot = "C:\\_catalogWork\\_collation";
    const localRoot = "G:\\eGangotri-Tr-31-39"

    const localSubFolder = [31, 32, 33, 34, 35, 36, 37].map(x => `Treasures${x}`);

    // folderToExcel(`G:\\eGangotri-Tr-31-39\\Treasures33\\_freeze\\Jngm_Books`, _excelRoot);
    for (let folder of localSubFolder) {
        try {
            await folderToExcel(`${localRoot}\\${folder}`, _excelRoot);
        }
        catch (err) {
            console.log(err, "foderToExcel")
        }
    }
})();

//yarn run localToExcel