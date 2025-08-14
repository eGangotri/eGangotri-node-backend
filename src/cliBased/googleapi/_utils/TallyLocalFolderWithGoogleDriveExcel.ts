
import path from 'path';
import * as _ from 'lodash';
import { GDriveExcelHeaders } from "../types";
import { excelToJson } from "../../excel/ExcelUtils";
import { titleInGoogleDrive } from "./constants";
import { getAllPDFFiles } from '../../../utils/FileStatsUtils';
import { FileStats } from '../../../imgToPdf/utils/types';
import * as fsPromise from 'fs/promises';

const _excelToJson = async () => {
    const _root = "C:\\_catalogWork\\_collation";
    const treasureFolder = "Treasures 60";
    const mainExcelPath = `${_root}\\_googleDriveExcels\\${treasureFolder}`;
    const files = await fsPromise.readdir(mainExcelPath);
    const mainExcelFileName = `${mainExcelPath}\\${files[0]}`;
    const mainExcelData: GDriveExcelHeaders[] = excelToJson(mainExcelFileName);
    return mainExcelData;
}
const findCorrespondingExcelHeader = (local: FileStats, excelJson: GDriveExcelHeaders[]) => {
    const combinedObject: FileStats = local;
    let localTitle = local.fileName;

    excelJson?.find((_excel: GDriveExcelHeaders) => {
        if (localTitle === _excel[titleInGoogleDrive]) {
            FOUND_PDFS.push(local.fileName)
            return true
        }
    })

    return false;
}

const MISSING_PDFS: string[] = []
const FOUND_PDFS: string[] = [];

const tally = async (rootFolder: string) => {
    const localJson = await getAllPDFFiles(rootFolder)

    const excelJson = await _excelToJson();
    const matchedItems = localJson.filter(local => findCorrespondingExcelHeader(local, excelJson));

    console.log(`localJson ${JSON.stringify(localJson.length)} excelJson ${JSON.stringify(excelJson.length)}`)
    console.log(`matchedItems ${JSON.stringify(matchedItems.length)}`)
    console.log(`MISSING_PDFS ${JSON.stringify(MISSING_PDFS.length)}`)
    console.log(`FOUND_PDFS ${JSON.stringify(FOUND_PDFS.length)}`)
}

tally("D:\\eG-tr1-30\\Treasures30\\Otro");
//pnpm run tallyWithLocal