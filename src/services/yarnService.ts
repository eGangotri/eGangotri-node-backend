import { isValidPath } from "../utils/utils";
import { moveAFile, moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

import { getAllFileListingWithStats, getAllPDFFiles, getAllPDFFilesWithMedata } from "../utils/FileStatsUtils";
import { FileStats } from "../imgToPdf/utils/types";
import { sizeInfo } from "../mirror/FrontEndBackendCommonCode";
import * as path from 'path';
import moment from "moment";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";
import * as FileUtils from '../utils/FileStatsUtils';

import * as _ from 'lodash';

import { addSummaryToExcel, createMetadata } from "../excelToMongo/Util";
import { jsonToExcel } from "../cliBased/excel/ExcelUtils";
import { getLatestUploadCycleById } from "./uploadCycleService";
import { FileMoveTracker } from "../models/FileMoveTracker";
import { file } from "pdfkit";
import { error } from "console";
import { createFolderIfNotExistsAsync } from "utils/FileUtils";

const _root = "C:\\_catalogWork\\_collation\\local";

export const moveProfilesToFreeze = async (profileAsCSV: string,
    flatten: boolean = true,
    ignorePaths = []) => {
    const _response = []
    for (let profile of profileAsCSV.split(',')) {
        const srcPath = getFolderInSrcRootForProfile(profile.trim());
        const destPath = getFolderInDestRootForProfile(profile.trim());
        await createFolderIfNotExistsAsync(destPath)
        if (isValidPath(srcPath) && isValidPath(destPath)) {
            _response.push(await moveFileSrcToDest(srcPath, destPath, flatten, ignorePaths));
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


export const moveItemsInListOfProfileToFreeze = async (uploadCycleId: string) => {
    const _response = []
    const _uploads = await getLatestUploadCycleById(uploadCycleId);

    const archiveProfiles = _uploads.archiveProfiles;

    for (let archiveProfile of archiveProfiles) {
        const destPath = getFolderInDestRootForProfile(archiveProfile.archiveProfile.trim());
        try {
            await fsPromise.access(destPath);
        } catch {
            await fsPromise.mkdir(destPath, { recursive: true });
        }
        if (isValidPath(destPath)) {
            const _moveResponse = await moveFileInListToDest(archiveProfile, destPath);
            _response.push(_moveResponse);
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid destPath ${destPath} for PROFILE: ${archiveProfile.archiveProfile}`,
                errorList: archiveProfile.absolutePaths,
                src: archiveProfile.archiveProfilePath,
                dest: destPath,
                destFolderOrProfile: archiveProfile.archiveProfile
            });
        }
    }
    return _response
}

export const moveFileInListToDest = async (profileData: {
    absolutePaths: string[];
    count?: number;
    archiveProfile?: string;
    archiveProfilePath?: string;
},
    destFolderOrProfile: string) => {
    const _fileCollisionsResolvedByRename: string[] = []
    const _renamedWithoutCollision: string[] = []
    const errorList: string[] = []
    const errorAbsPathList: string[] = []
    const filesAbsPathMoved = [];

    const destPath = isValidPath(destFolderOrProfile) ? destFolderOrProfile : getFolderInSrcRootForProfile(destFolderOrProfile)
    for (let absPathOfFileToMove of profileData.absolutePaths) {
        try {
            console.log(`moveFileInListToDest
                 absPathOfFilesToMove ${absPathOfFileToMove}
                 destFolderOrProfile: ${destFolderOrProfile} 
                 destPath ${destPath}`)
            const moveAFileRes = await moveAFile(absPathOfFileToMove, destFolderOrProfile, path.basename(absPathOfFileToMove));

            if (moveAFileRes.renamedWithoutCollision.length > 0) {
                _renamedWithoutCollision.push(moveAFileRes.renamedWithoutCollision)
                filesAbsPathMoved.push(absPathOfFileToMove)
            }
            else if (moveAFileRes.fileCollisionsResolvedByRename.length > 0) {
                _fileCollisionsResolvedByRename.push(moveAFileRes.fileCollisionsResolvedByRename)
            }
            else {
                errorList.push(`Couldnt move file ${absPathOfFileToMove} to ${destPath}\n`)
                errorAbsPathList.push(absPathOfFileToMove)
            }
        }
        catch (err) {
            console.log('Error', err);
            errorAbsPathList.push(absPathOfFileToMove)
            errorList.push(`Exception thrown while moving file ${absPathOfFileToMove} to ${destPath} \n${err}`)
        }
    }
    return {
        success: errorList.length === 0,
        total: profileData.absolutePaths.length,
        msg: `${_renamedWithoutCollision.length} files moved from Source ${profileData?.archiveProfilePath || ""} to target dir ${destPath}.
        \n${_fileCollisionsResolvedByRename.length} files had collisions resolved by renaming.
        \n${errorList.length} file(s) had errors while moving`,
        errorList,
        errorAbsPathList,
        fileMoved: _renamedWithoutCollision,
        filesAbsPathMoved: filesAbsPathMoved,
        fileCollisionsResolvedByRename: _fileCollisionsResolvedByRename,
        src: profileData.archiveProfilePath,
        dest: destPath,
        destFolderOrProfile: profileData.archiveProfile
    }
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
        const tracker = new FileMoveTracker({
            src: srcPath,
            dest: destPath,
            destFolderOrProfile,
            ..._report
        });
        await tracker.save()
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

export const moveFilesInArray = async (srcPaths: string[], destPaths: string[]) => {
    if (srcPaths.length !== destPaths.length) {
        throw new Error('Source and destination arrays must have the same length');
    }
    console.log(`moveFilesInArray srcPaths ${srcPaths?.length} destPaths ${destPaths?.length}`);
    const results = [];

    for (let i = 0; i < srcPaths.length; i++) {
        const srcPath = srcPaths[i];
        const destPath = destPaths[i];
        const srcFileName = path.basename(srcPath);
        const destFileName = path.basename(destPath);

        if (srcFileName !== destFileName) {
            results.push({
                success: false,
                msg: `File name mismatch: ${srcFileName} does not match ${destFileName}`
            });
            continue;
        }

        try {
            await fsPromise.mkdir(path.dirname(destPath), { recursive: true });
            await fsPromise.rename(srcPath, destPath);
            results.push({
                success: true,
                src: srcPath,
                dest: destPath,
                msg: `File renamed successfully from ${srcPath} to ${destPath}`
            });
        } catch (err) {
            if (err.code === 'EPERM') {
                console.error(`Permission error: ${err.message}`);
            } else {
                console.error(`Error renaming file: ${err.message}`);
            }
            results.push({
                success: false,
                src: srcPath,
                dest: destPath,
                msg: `Error:(${err?.code}) renaming file from ${srcPath} to ${destPath}: ${err.message}`,
                err: err
            });
        }
    }

    const successCount = results.filter(result => result.success).length;
    const failureCount = results.filter(result => !result.success).length;
    return {
        msg: `Moved ${successCount}/${srcPaths.length} files. ${failureCount}/${srcPaths.length} files failed`,
        successCount,
        failureCount,
        success: results.every(result => result.success),
        results
    };
};

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
                const textFileWrittenTo = await createPdfReportAsText(metadata, options.pdfsOnly, path.basename(folder));
                const excelWrittenTo = await createExcelReport(metadata, options.pdfsOnly, path.basename(folder))
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

async function createPdfReportAsText(metadata: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const report = generateTextFileContent(metadata, pdfsOnly);
    const absPath = await createFileName(pdfsOnly, metadata.length, folderBase, 'txt');
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

async function createFileName(pdfsOnly: boolean, fileCount: number, folderBase: string, ext: string) {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT) + "_HOURS"
    const fileName = `${folderBase}_MegaList_${pdfsOnly ? 'pdfs_only' : 'all_files'}-${fileCount}Items-${timeComponent}.${ext}`;
    const filePath = `${_root}\\${folderBase}`;
    try {
        await fsPromise.access(filePath);
    } catch {
        await fsPromise.mkdir(filePath, { recursive: true });
    }

    const absPath = `${filePath}\\${fileName}`;
    return absPath;
}
async function createExcelReport(fileStats: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const absPath = await createFileName(pdfsOnly, fileStats.length, folderBase, 'xlsx');
    const { totalFileCount, totalPageCount, totalSizeRaw } = createMetadata(fileStats);
    addSummaryToExcel(fileStats, totalFileCount, totalPageCount, totalSizeRaw);
    jsonToExcel(fileStats, absPath)
    console.log(`Excel File Written to ${absPath}!`);
    return absPath
}

