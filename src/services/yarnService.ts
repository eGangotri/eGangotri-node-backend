import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../cliBased/utils";
import * as fs from 'fs';
import { getAllPDFFilesWithMedata } from "../imgToPdf/utils/FileUtils";
import { FileStats } from "../imgToPdf/utils/types";
import { sizeInfo } from "../mirror/FrontEndBackendCommonCode";
import * as path from 'path';
import moment from "moment";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";
import * as _ from 'lodash';
import { addSummaryToExcel, createMetadata } from "./Util";
import { jsonToExcel } from "../cliBased/excel/ExcelUtils";

const _root = "C:\\_catalogWork\\_collation\\local";

export const moveProfilesToFreeze = async (profileAsCSV: string, flatten: boolean = true) => {
    const _response = []
    for (let profile of profileAsCSV.split(',')) {
        const srcPath = getFolderInSrcRootForProfile(profile.trim());
        const destPath = getFolderInDestRootForProfile(profile.trim());
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        if (isValidPath(srcPath) && isValidPath(destPath)) {
            _response.push(await moveFileSrcToDest(srcPath, destPath, flatten));
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid srcPath ${srcPath} or destPath ${destPath} for PROFILE: ${profile}`
            });
        }
    }
    return {
        response: _response
    };
}

export const moveFileSrcToDest = async (srcPath: string, destFolderOrProfile: string, flatten: boolean = true) => {
    const destPath = isValidPath(destFolderOrProfile) ? destFolderOrProfile : getFolderInSrcRootForProfile(destFolderOrProfile)
    try {
        console.log(`moveFileSrcToDest srcPath ${srcPath}/${destFolderOrProfile} destPath ${destPath}  flatten ${flatten}`)
        let _report
        if (flatten) {
            _report = await moveFilesAndFlatten(srcPath, destPath);
        }
        else {
            //get this ready
            _report = await moveFilesAndFlatten(srcPath, destPath);
        }
        return {
            ..._report
        };
    }
    catch (err) {
        console.log('Error', err);
        return {
            success: false,
            msg: `Error while moving files from ${srcPath} to ${destPath} \n${err}`,
            err: err
        };
    }
}

const getFoldersFromInput = (argFirst: string) => {
    const profileOrPaths = argFirst.includes(",") ? argFirst.split(",").map((link: string) => link.trim()) : [argFirst.trim()];
    console.log(`profileOrPaths ${profileOrPaths}`);

    const pdfDumpFolders = isValidPath(profileOrPaths[0]) ? profileOrPaths :
        profileOrPaths.map((_profileOrPath: string) => {
            return getFolderInDestRootForProfile(_profileOrPath)
        });

    console.log(`pdfDumpFolders ${pdfDumpFolders}`)

    return pdfDumpFolders
}

export const publishBookTitles = async (argFirst: string, pdfsOnly = true) => {
    const pdfDumpFolders = getFoldersFromInput(argFirst);

    const _response = []
    for (let folder of pdfDumpFolders) {
        if (isValidPath(folder)) {
            const metadata = await getAllPDFFilesWithMedata(folder);
            const textFileWrittenTo = createPdfReportAsText(metadata, pdfsOnly, path.basename(folder));
            const excelWrittenTo = createExcelReport(metadata, pdfsOnly, path.basename(folder))
            _response.push({
                success: true, msg: `Published Folder Contents for ${folder}\n
                Text file: ${textFileWrittenTo}\n
                Excel File: ${excelWrittenTo}`
            });
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid folder ${folder}`
            });
        }
    }
    return {
        response: _response
    };
}

function createPdfReportAsText(metadata: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const report = generateTextFile(metadata, pdfsOnly);
    const absPath = createFileName(pdfsOnly, folderBase, 'txt');
    fs.writeFileSync(absPath, report);
    return absPath;
}

function generateTextFile(metadata: Array<FileStats>, pdfsOnly: boolean) {
    console.log(`generateTextFile ${metadata.length} pdfsOnly ${pdfsOnly}`)
    let report = '';
    metadata.forEach((fileStats: FileStats) => {
        report += `${fileStats.rowCounter}). ${fileStats.fileName}, ${fileStats.pageCount} pages, ${fileStats.size}\n`
    });

    const { totalFileCount, totalPageCount, totalSizeRaw } = createMetadata(metadata);
    const summary = createMetadataSummary(totalFileCount, totalPageCount, totalSizeRaw);

    const fullReport = `${report}
    ${summary}`
    console.log(fullReport)
    return fullReport;
}

const createMetadataSummary = (totalFileCount: number, totalPageCount: number, totalSizeRaw: number) => {
    return `PDF Stats:
    Total File Count: ${totalFileCount}
    Total Files Processed: ${totalFileCount}
    Total Files with Errors(including password-protected): ?
    Total Files system didnt pick: ?
    Erroneous File List: ?
    Password Protected Erroneous File List: ?
    Total Files Read Successfully: ${totalFileCount}
    Total Size of Files: ${sizeInfo(totalSizeRaw)}
    Total Size of Files Raw: ${totalSizeRaw}
    Total Pages: ${totalPageCount}`
}

function createFileName(pdfsOnly: boolean, folderBase: string, ext: string) {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const fileName = `${folderBase}_MegaList_${pdfsOnly ? 'pdfs_only' : 'all_files'}-${timeComponent}.${ext}`;
    const absPath = `${_root}\\${folderBase}\\${fileName}`;
    return absPath;
}
function createExcelReport(fileStats: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const absPath = createFileName(pdfsOnly, folderBase, 'xlsx');
    const { totalFileCount, totalPageCount, totalSizeRaw } = createMetadata(fileStats);
    addSummaryToExcel(fileStats, totalFileCount, totalPageCount, totalSizeRaw);
    jsonToExcel(fileStats, absPath)
    console.log(`Excel File Written to ${absPath}!`);
    return absPath
}
