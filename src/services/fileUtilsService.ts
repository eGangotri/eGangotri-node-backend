import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { getAllPDFFiles } from "../utils/FileStatsUtils";
import { isValidPath } from "../utils/FileUtils";
import { FileStats } from "../imgToPdf/utils/types";
import { GDriveExcelHeadersFileRenamerV2 } from "../cliBased/googleapi/types";
import { isNumber } from "../mirror/utils";
import { checkFolderExistsSync } from "../utils/FileUtils";

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
            const firstKey = Object.keys(x)[0];
            return isNumber((x as any)[firstKey])
        })
        //
        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
        const localFileStats = await getAllPDFFiles(folder);
        console.log(`excelData: ${excelData?.length} `);
        renameReport.totalInExcel = excelData?.length || 0
        renameReport.totalInFolder = localFileStats?.length || 0

        for (let excelRow of excelData) {
            let _newFileName = sanitizeFileNameAndAppendPdfExt(excelRow["Composite Title"]);
            const origName = excelRow["Orig Name"]?.trim()
            if ((_newFileName?.length > 0 && origName?.length > 0) && (!_newFileName.startsWith("=") && !origName.startsWith("="))) {
                await renameFileViaFormula(origName, _newFileName, localFileStats, renameReport)
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

export const renameFilesViaExcelUsingSpecifiedColumns = async (excelPath: string,
    folderOrProfile: string, col1: number, col2: number) => {
    let renameReport: RenameReportType = {
        errorList: [],
        success: [],
        totalInExcel: 0,
        totalInFolder: 0
    }

    try {
        const excelData: any[] = excelToJson(excelPath).filter((x: any) => {
            const firstKey = Object.keys(x)[0];
            return isNumber(x[firstKey])
        })
        //
        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
        const localFileStats = await getAllPDFFiles(folder);
        console.log(`excelData: ${excelData?.length} `);
        renameReport.totalInExcel = excelData?.length || 0
        renameReport.totalInFolder = localFileStats?.length || 0

        for (let excelRow of excelData) {
            const excelRowKeys = Object.keys(excelRow)
            console.log(`excelRowKeys: ${excelRowKeys}`)
            if (col1 < 0 || col2 < 0 || col1 - 1 >= excelRowKeys.length || col2 - 1 >= excelRowKeys.length) {
                renameReport.errorList.push(`Invalid columns ${col1}, ${col2}. Total Col. Count: ${excelRowKeys.length}`)
                continue
            }
            const oldFileNameKey = excelRowKeys[col1 - 1];
            const newFileNameKey = excelRowKeys[col2 - 1];

            let _newFileName = sanitizeFileNameAndAppendPdfExt(excelRow[newFileNameKey]);
            const origName = excelRow[oldFileNameKey]?.trim()
            console.log(`_newFileName: ${_newFileName} origName: ${origName}`);
            if ((_newFileName?.length > 0 && origName?.length > 0) && (!_newFileName.startsWith("=") && !origName.startsWith("="))) {
                await renameFileViaFormula(origName, _newFileName, localFileStats, renameReport)
            }
            else {
                renameReport.errorList.push(`No File in Local for origName ${origName} renameable to ${_newFileName}.`)
            }
        }
    }
    catch (err: any) {
        console.log('Error', err);
        return err;
    }
    return renameReport;
}

export const renameFileViaFormula = async (origName: string,
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
    if (!_fileInFolder) {
        renameReport.errorList.push(`renameFileViaFormula: No File in Local for origName ${origName} renameable to ${newName}.`)
        return
    }
    await _renameFileInFolder(_fileInFolder, newName, renameReport)
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
    return sanitizeFileNameAndAppendPdfExt(newFileName);
}

export const sanitizeFileNameAndAppendPdfExt = (_fileName: any) => {
    return `${sanitizeFileName(_fileName)}.pdf`;
}

export const sanitizeFileName = (_fileName: any) => {
    const _removeExtraneousChars = removeExtraneousChars(_fileName);
    const removeTrailingDash = _removeExtraneousChars?.endsWith("-") ? _removeExtraneousChars?.slice(0, -1)?.trim() : _removeExtraneousChars.trim();
    const removeExtraSpaces = removeTrailingDash.split(/\s+/).join(' ');
    return removeExtraSpaces;
}

export const limitStringToCharCount = (str: string, maxLength: number) => {
    if (str.length > maxLength) {
        return str.substring(0, maxLength);
    }
    return str;
}


export const limitCountAndSanitizeFileNameWithoutExt = (fileName: string, maxLength: number) => {
    const ext = path.extname(fileName);
    const removeExt = ext ? fileName.slice(0, -ext.length) : fileName;
    const newName = limitStringToCharCount(sanitizeFileName(removeExt), maxLength);
    return `${newName}${ext}`;
}

//remove colon etc not allowed in a File
const removeExtraneousChars = (fileNameFrag: any) => {
    const sanitized = fileNameFrag?.toString()?.trim()?.replace(/[\\/:*?"<>|]/g, "") || "";
    return sanitized?.trim();
}

export const _renameFileInFolder = async (_fileInFolder: FileStats, newFileName: string, renameReport: RenameReportType) => {
    if (!_fileInFolder) {
        renameReport.errorList.push(`No File in Local renameable to ${newFileName}.`)
        return
    }
    console.log(`_fileInFolder: ${JSON.stringify(_fileInFolder?.absPath)} `);
    const absPath = _fileInFolder?.absPath
    if (checkFolderExistsSync(absPath)) {
        try {
            const parentDir = path.dirname(absPath);
            const newPath = path.join(parentDir, newFileName);
            if (!newPath.endsWith(".pdf")) {
                throw new Error(`${newPath} doesnt end with .pdf`);
            }
            if (newPath.length < 8) {
                throw new Error(`${newPath} length is too short`);
            }
            if (checkFolderExistsSync(newPath)) {
                throw new Error(`${newPath} already exists`);
            }
            await fsPromise.rename(absPath, newPath);
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