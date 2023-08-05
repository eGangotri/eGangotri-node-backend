import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils"
import path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import { ExcelHeaders } from "../types";
import { excelToJson } from "./ExcelUtils";
import { titleInGoogleDrive } from "./constants";

type PdfFolderTitleType = {
    folder: string,
    fileName: string
}

const convertLocalPdfsToJson = (rootFolder: string) => {
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
    console.log(`pdfTuple ${pdfTuple[0]} ${pdfTuple.length}`)
    return pdfTuple
}

const _excelToJson = () => {
    const _root = "C:\\_catalogWork\\_collation";
    const treasureFolder = "Treasures 21"

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