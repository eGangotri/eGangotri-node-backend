import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { getAllPDFFiles } from "../utils/FileStatsUtils";
import { isValidPath } from "../utils/utils";
import * as fs from "fs";
import * as path from 'path';
import { FileStats } from "../imgToPdf/utils/types";
import { GDriveExcelHeadersFileRenamerV2 } from "../cliBased/googleapi/types";
import { isNumber } from "../mirror/utils";

interface RenameReportType {
    errorList: string[],
    success: string[],
    totalInExcel: number,
    totalInFolder: number,
}

/**
 * 
 * @param excelPath https://docs.google.com/spreadsheets/d/1vjZVryQDluL6JUUIG5h0dAt4IlH9hfHZ/edit?gid=1858041903#gid=1858041903
 * @returns 
 */
export const renameFilesViaExcel = async (excelPath: string, folderOrProfile: string) => {
    let renameReport: RenameReportType = {
        errorList: [],
        success: [],
        totalInExcel: 0,
        totalInFolder: 0
    }

    try {
        const excelData: GDriveExcelHeadersFileRenamerV2[] = excelToJson(excelPath).filter((x: GDriveExcelHeadersFileRenamerV2) => {
            return isNumber(x["S.No"])
        })
        //
        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
        const localFileStats = await getAllPDFFiles(folder);
        console.log(`excelData: ${excelData?.length} `);
        renameReport.totalInExcel = excelData?.length || 0
        renameReport.totalInFolder = localFileStats?.length || 0

        for (let excelRow of excelData) {
            let _newFileName = sanitizeFileName(excelRow["Composite Title"]);
            const origName = excelRow["Orig Name"]?.trim()
            if ((_newFileName?.length > 0 && origName?.length > 0) && (!_newFileName.startsWith("=") && !origName.startsWith("="))) {
                console.log(`_newFileNameX: ${_newFileName} `);
                renameFileViaFormula(origName, _newFileName, localFileStats, renameReport)
            }
            else {
                renameFileViaReadingColumns(excelRow, localFileStats, renameReport)
            }
        }
    }
    catch (err: any) {
        console.log('Error', err);
        return err;
    }
    return renameReport;
}

export const renameFileViaFormula = (origName: string,
    newName: string,
    localFileStats: FileStats[],
    renameReport: RenameReportType) => {

    console.log(`renameFileViaFormula:origName: ${origName}
     newFileName: ${newName} `);
    const _fileInFolder = localFileStats.find((fileStat) => {
        if (fileStat.fileName === origName) {
            console.log(`fileStat: ${JSON.stringify(fileStat)} `);
        }
        return fileStat.fileName === origName
    });
    _renameFileInFolder(_fileInFolder, newName, renameReport)
}

export const renameFileViaReadingColumns = (excelData: GDriveExcelHeadersFileRenamerV2,
    localFileStats: FileStats[],
    renameReport: RenameReportType) => {

    /**
        "Title in Google Drive": string;
     * 
     * "Title in English": string;
        "Sub-Title": string;
        "Author": string;
        "Commentator/ Translator/Editor": string;
        "Language(s)": string;
        "Subject/ Descriptor": string;
        "Publisher": string;
        "Edition/Statement": string;
        "Place of Publication": string;
        "Year of Publication": string;
     */

    const newFileName = createNewFileName(excelData);

    const _titleInGoogleDrive = excelData["Title in Google Drive"]
    const origName = getOrigName(_titleInGoogleDrive)

    console.log(`renameFileViaReadingColumns:origName: ${JSON.stringify(origName)} newFileName: ${JSON.stringify(newFileName)} `);
    const _fileInFolder = localFileStats.find((fileStat) => {
        if (fileStat.fileName === origName) {
            console.log(`fileStat: ${JSON.stringify(fileStat)} `);
        }
        return fileStat.fileName === origName
    });
    _renameFileInFolder(_fileInFolder, newFileName, renameReport)
}

const createNewFileName = (excelData: GDriveExcelHeadersFileRenamerV2): string => {
    const newFileName =
        `${removeExtraneousChars(excelData["Title in English"])} ${removeExtraneousChars(excelData["Sub-Title"])} ${removeExtraneousChars(excelData["Author"])}\
    ${removeExtraneousChars(excelData["Commentator/ Translator/Editor"])} ${removeExtraneousChars(excelData["Language(s)"])} ${removeExtraneousChars(excelData["Subject/ Descriptor"])}\
    ${removeExtraneousChars(excelData["Edition/Statement"])} ${removeExtraneousChars(excelData["Place of Publication"])}\
     ${removeExtraneousChars(excelData["Year of Publication"])} - ${removeExtraneousChars(excelData["Publisher"])}`;
    return sanitizeFileName(newFileName);
}

const sanitizeFileName = (_fileName: any) => {
    const _removeExtraneousChars = removeExtraneousChars(_fileName);
    const removeTrailingDash = _removeExtraneousChars?.endsWith("-") ? _removeExtraneousChars?.slice(0, -1)?.trim() : _removeExtraneousChars.trim();
    const removeExtraSpaces = removeTrailingDash.split(/\s+/).join(' ');
    return `${removeExtraSpaces}.pdf`;
}

//remove colon etc not allowed in a File
const removeExtraneousChars = (fileNameFrag: any) => {
    const sanitized = fileNameFrag?.toString()?.trim()?.replace(/[\\/:*?"<>|]/g, "") || "";
    return sanitized?.trim();
}

export const _renameFileInFolder = (_fileInFolder: FileStats, newFileName: string, renameReport: RenameReportType) => {
    if (!_fileInFolder) {
        renameReport.errorList.push(`No File in Local renameable to ${newFileName}.`)
        return
    }
    console.log(`_fileInFolder: ${JSON.stringify(_fileInFolder?.absPath)} `);
    const absPath = _fileInFolder?.absPath
    if (fs.existsSync(absPath)) {
        try {
            const parentDir = path.dirname(absPath);
            const newPath = path.join(parentDir, newFileName);
            fs.renameSync(absPath, newPath);
            console.log(`File renamed to ${newFileName}`)
            renameReport.success.push(`File ${absPath} renamed to ${newFileName}`)
        }
        catch (e) {
            console.log(`Error renaming file ${absPath} to ${newFileName} ${e}`)
            renameReport.errorList.push(`Error renaming file ${absPath} to ${newFileName} ${e}`)
        }
    }
    else {
        renameReport.errorList.push(`Doestnt exist ${absPath}.`)
    }
}


const getOrigName = (_titleInGoogleDrive: string) => {
    const extension = _titleInGoogleDrive.match(/\.[^/.]+$/)?.[0] || '';
    const nameWithoutExtension = _titleInGoogleDrive.replace(extension, '');
    const slicedName = nameWithoutExtension.slice(0, -5);
    return slicedName + extension;
}