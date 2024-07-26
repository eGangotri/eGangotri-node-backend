import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import * as fs from 'fs';
import { getAllFileListingWithoutStats, getAllFileListingWithStats, getAllPDFFiles, getAllPDFFilesWithMedata } from "../utils/FileStatsUtils";
import { FileStats } from "../imgToPdf/utils/types";
import { sizeInfo } from "../mirror/FrontEndBackendCommonCode";
import * as path from 'path';
import moment from "moment";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";
import * as FileUtils from '../utils/FileStatsUtils';
import * as FileConstUtils from '../utils/constants';

import * as _ from 'lodash';

import { addSummaryToExcel, createMetadata } from "../excelToMongo/Util";
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

export const moveFileSrcToDest = async (srcPath: string, 
    destFolderOrProfile: string, 
    flatten: boolean = true,
    ignorePaths = []) => {
    const destPath = isValidPath(destFolderOrProfile) ? destFolderOrProfile : getFolderInSrcRootForProfile(destFolderOrProfile)
    try {
        console.log(`moveFileSrcToDest srcPath ${srcPath}/${destFolderOrProfile} destPath ${destPath}  flatten ${flatten}`)
        let _report
        if (flatten) {
            _report = await moveFilesAndFlatten(srcPath, destPath, true, ignorePaths);
        }
        else {
            //get this ready
            _report = await moveFilesAndFlatten(srcPath, destPath, true, ignorePaths);
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

export const publishBookTitlesList = async (argFirst: string, options: {
    withStats: boolean,
    pdfsOnly: boolean,
    onlyInfoNoExcel: boolean
}) => {
    const foldersToProcess = getFoldersFromInput(argFirst);
    const _response = []
    for (let folder of foldersToProcess) {
        if (isValidPath(folder)) {
            let metadata = []
            if (options.pdfsOnly) {
                console.log(`pdfsOnly ${options.pdfsOnly}`)
                if (options.withStats) {
                    console.log(`pdfsOnly ${options.pdfsOnly} !options.withStats: ${options.withStats}`)
                    metadata = await getAllPDFFilesWithMedata(folder);
                }
                else {
                    console.log(`pdfsOnly ${options.pdfsOnly} 
                    options.withStats: ${options.withStats}`)
                    metadata = await getAllPDFFiles(folder);
                }
            }
            else {
                if (options.withStats) {
                    console.log(`notPDF: withStats ${options.withStats}`)
                    metadata = await getAllFileListingWithStats(folder);
                }
                else {
                    console.log(`notPDF: !withStats ${options.withStats}`)
                    metadata = await FileUtils.getAllFileListingWithFileSizeStats(folder);
                }
            }
            const totalSize = sizeInfo(metadata.reduce((total, fileStats) => total + fileStats.rawSize, 0))
            const itemsCount = metadata.length

            if (!options.onlyInfoNoExcel) {
                console.log(`!onlyInfoNoExcel ${options.onlyInfoNoExcel}`)
                const textFileWrittenTo = createPdfReportAsText(metadata, options.pdfsOnly, path.basename(folder));
                const excelWrittenTo = createExcelReport(metadata, options.pdfsOnly, path.basename(folder))
                console.log(`Published Folder Contents for ${folder}\n`)
                _response.push({
                    success: true,
                    excelName: excelWrittenTo,
                    itemsCount: itemsCount,
                    totalSize,
                    msg: `Published Folder Contents for ${folder}\n
                Text file: ${textFileWrittenTo}\n
                Excel File: ${excelWrittenTo}`
                });
            }

            else {
                console.log(`!withStatswithStats ${options.withStats}`)
                const _res = {
                    success: true,
                    itemsCount,
                    folders: foldersToProcess,
                    totalSize
                }
                if (options.withStats) {
                    console.log(`else options.withStats:${options.withStats}`)
                    let totalPageCount = metadata.reduce((total, fileStats) => total + fileStats.pageCount, 0);
                    _res['totalPageCount'] = totalPageCount;
                    _res['msg'] = metadata.map((fileStats: FileStats) =>
                        `(${fileStats.rowCounter}). ${fileStats.fileName} ${fileStats.pageCount} page(s)`
                    );
                }
                else {
                    _res['msg'] = metadata.map((fileStats: FileStats) =>
                        `(${fileStats.rowCounter}). ${fileStats.fileName}`
                    )
                }
                _response.push(_res);
            }
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid folder ${folder}`
            });
        }
    }
    return {
        ..._response
    };
}

function createPdfReportAsText(metadata: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const report = generateTextFileContent(metadata, pdfsOnly);
    const absPath = createFileName(pdfsOnly, metadata.length, folderBase, 'txt');
    fs.writeFileSync(absPath, report);
    return absPath;
}

function generateTextFileContent(metadata: Array<FileStats>, pdfsOnly: boolean) {
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

function createFileName(pdfsOnly: boolean, fileCount: number, folderBase: string, ext: string) {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT) + "_HOURS"
    const fileName = `${folderBase}_MegaList_${pdfsOnly ? 'pdfs_only' : 'all_files'}-${fileCount}Items-${timeComponent}.${ext}`;
    const filePath = `${_root}\\${folderBase}`;
    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath);
    }
    const absPath = `${filePath}\\${fileName}`;
    return absPath;
}
function createExcelReport(fileStats: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const absPath = createFileName(pdfsOnly, fileStats.length, folderBase, 'xlsx');
    const { totalFileCount, totalPageCount, totalSizeRaw } = createMetadata(fileStats);
    addSummaryToExcel(fileStats, totalFileCount, totalPageCount, totalSizeRaw);
    jsonToExcel(fileStats, absPath)
    console.log(`Excel File Written to ${absPath}!`);
    return absPath
}

