import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils"
import path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { ExcelHeaders, PdfFolderTitleType } from "../types";
import { excelToJson } from "./ExcelUtils";
import { titleInGoogleDrive } from "./constants";
import { convertLocalPdfsToJson } from "./LocalFolderToExcel";




const _excelToJson = () => {
    const _root = "C:\\_catalogWork\\_collation";
    const treasureFolder = "Treasures 60"
    const mainExcelPath = `${_root}\\_catExcels\\${treasureFolder}`
    const mainExcelFileName = `${mainExcelPath}\\${fs.readdirSync(mainExcelPath)[0]}`;
    const mainExcelData: ExcelHeaders[] = excelToJson(mainExcelFileName);
    return mainExcelData

}

const findCorrespondingExcelHeader = (local: PdfFolderTitleType, excelJson: ExcelHeaders[]) => {
    const combinedObject: PdfFolderTitleType = local;
    let localTitle = local.fileName;

    excelJson?.find((_excel: ExcelHeaders) => {
        if (localTitle === _excel[titleInGoogleDrive]) {
            FOUND_PDFS.push(local.fileName)
            return true
        }
    })

    return false;
}

const MISSING_PDFS: string[] = []
const FOUND_PDFS: string[] = [];

const tally = (rootFolder: string) => {
    const localJson = convertLocalPdfsToJson(rootFolder)
    const excelJson = _excelToJson();
    const matchedItems = localJson.filter(local => findCorrespondingExcelHeader(local, excelJson));

    console.log(`localJson ${JSON.stringify(localJson.length)} excelJson ${JSON.stringify(excelJson.length)}`)
    console.log(`matchedItems ${JSON.stringify(matchedItems.length)}`)
    console.log(`MISSING_PDFS ${JSON.stringify(MISSING_PDFS.length)}`)
    console.log(`FOUND_PDFS ${JSON.stringify(FOUND_PDFS.length)}`)
}

tally("D:\\eG-tr1-30\\Treasures30\\Otro");
//yarn run tallyWithLocal