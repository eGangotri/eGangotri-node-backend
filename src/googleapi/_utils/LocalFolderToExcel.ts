import path from "path";
import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils";
import { PdfFolderTitleType } from "../types";
import * as fs from 'fs';
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/utils";
import moment from "moment";
import { jsonToExcel } from "./ExcelUtils";

const _root = "C:\\_catalogWork\\_collation";
const treasureFolder = "Treasures-2"

const createExcelFilePathName = (mainExcelDataLength: number) => {
    const _localPath = `${_root}\\local`;

    if (!fs.existsSync(_localPath)) {
        fs.mkdirSync(_localPath);
    }
    const mergedExcelPath = `${_localPath}\\${treasureFolder}`;

    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    if (!fs.existsSync(mergedExcelPath)) {
        fs.mkdirSync(mergedExcelPath);
    }
    const mergedExcelFileName = `${mergedExcelPath}\\${treasureFolder}-Final-Merged-Catalog-${timeComponent}`;
    return `${mergedExcelFileName}-${mainExcelDataLength}.xlsx`;
}

export const convertLocalPdfsToJson = (rootFolder: string) => {
    const allPdfs = getAllPDFFiles(rootFolder)
    let pdfTuple: Array<PdfFolderTitleType> = []
    for (const [index, pdf] of allPdfs.entries()) {
        const _path = path.parse(pdf);
        pdfTuple.push({
            folder: _path.dir,
            fileName: _path.base
        })
        console.log(`${index + 1}) ${_path.base}
       `);
    }
    console.log(`pdfTuple ${JSON.stringify(pdfTuple[0])} ${pdfTuple.length}`)
    return pdfTuple
}

const folderToExcel = (folder:string) => {
    const jsonArray = convertLocalPdfsToJson(folder)
    const _fileName = createExcelFilePathName(jsonArray.length);
    jsonToExcel(jsonArray, _fileName)
}

folderToExcel("D:\\eG-tr1-30\\Treasures30");

//yarn run localToExcel