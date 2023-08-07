import path from "path";
import * as FileUtils from "../../imgToPdf/utils/FileUtils";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { jsonToExcel } from "./ExcelUtils";
import * as _ from 'lodash';
import { sizeInfo } from "../../mirror/FrontEndBackendCommonCode";

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
    console.log(`folderToExcel ${folder}`);
    FileUtils.incrementRowCounter()
    const jsonArray = await FileUtils.getAllPDFFilesWithMedata(folder)
    jsonArray.push({
        size: "",
        absPath: "",
        folder: "",
        fileName: ""
    })
    const pageCountTotal = _.sum(jsonArray.map(x => x.pageCount))
    const rawSizeTotal = _.sum(jsonArray.map(x => x.rawSize))
    const sizeTotal = sizeInfo(rawSizeTotal)

    jsonArray.push({
        pageCount: pageCountTotal,
        rawSize: rawSizeTotal,
        size: sizeTotal,
        absPath: "",
        folder: "",
        fileName: ""
    })

    const _fileName = createExcelFilePathName(jsonArray.length, path.parse(folder)?.base, _excelRoot);
    jsonToExcel(jsonArray, _fileName)
}


(async () => {
    const _excelRoot = "C:\\_catalogWork\\_collation";
    const localRoot = "G:\\eGangotri-Tr-31-39"

    const localSubFolder = [31, 32, 33, 34, 35, 36, 37,38,39].map(x => `Treasures${x}`);

    for (let folder of localSubFolder) {
        try {
          //  await folderToExcel(`${localRoot}\\${folder}`, _excelRoot);
        }
        catch (err) {
            console.log(err, "foderToExcel")
        }
    }
})();
console.log("Dont use this. use the Groovy Version as this wont work for files over 2 GB")
//yarn run localToExcel