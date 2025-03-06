import * as fsPromise from 'fs/promises';

import { getPdfPageCountUsingPdfLib } from "../imgToPdf/utils/PdfLibUtils";
import * as path from 'path';
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import { FileStatsOptions } from '../imgToPdf/utils/types';
import { ellipsis } from '../mirror/utils';
import _ from 'lodash';
import { PDF_EXT, ZIP_EXT } from '../imgToPdf/utils/constants';

import { FileStats } from "imgToPdf/utils/types";
import { formatTime } from '../imgToPdf/utils/Utils';
import * as FileConstUtils from '../utils/constants';

export interface GetAllFileStatsOptions {
    directoryPath: string;
    filterExt?: string[];
    ignorePaths?: string[];
    ignoreFolders?: boolean;
    withLogs?: boolean;
    withMetadata?: boolean;
    includeFolders?: boolean;
}

export async function getAllFileStats({
    directoryPath,
    filterExt = [],
    ignorePaths = [],
    ignoreFolders = false,
    withLogs = false,
    withMetadata = false,
    includeFolders = false
}: GetAllFileStatsOptions): Promise<FileStats[]> {
    const rowCounterController = Math.random().toString(36).substring(7);
    FileConstUtils.resetRowCounter(rowCounterController);
    const queue = [directoryPath];
    let _files: FileStats[] = [];
    let counter = 0;

    while (queue.length > 0) {
        const currentDir = queue.shift();
        const dirContent = await fsPromise.readdir(currentDir, { withFileTypes: true });

        for (const dirent of dirContent) {
            const fullPath = path.join(currentDir, dirent.name);

            if (ignorePaths && ignorePaths.some((item: string) => fullPath.includes(item))) {
                console.log(`Ignoring ${fullPath} due to ${ignorePaths}`);
                continue;
            }
            // console.log(`not Ignoring ${fullPath} due to ${ignorePaths}`);

            if (dirent.isDirectory()) {
                if (includeFolders) {
                    _files.push({
                        rowCounter: counter++,
                        absPath: fullPath,
                        folder: path.parse(fullPath).dir,
                        fileName: path.parse(fullPath).base,
                        ext: FileConstUtils.FOLDER
                    })
                }
                queue.push(fullPath);
            } else if (dirent.isFile()) {
                const ext = path.extname(fullPath);
                if (!_.isEmpty(filterExt) &&
                    (filterExt.every((item: string) => ext.toLowerCase() !== item))) {
                    continue;
                }
                const _path = path.parse(fullPath);
                const rawSize = await Mirror.getFileSizeAsync(fullPath) || 0;

                let fileStat: FileStats = {
                    rowCounter: counter++,
                    absPath: fullPath,
                    folder: _path.dir,
                    fileName: _path.base,
                    ext,
                    rawSize,
                    size: Mirror.sizeInfo(rawSize),
                }

                if (withLogs) {
                    console.log(`${FileConstUtils.getRowCounter(rowCounterController)[0]}/${FileConstUtils.getRowCounter(rowCounterController)[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${Mirror.sizeInfo(rawSize)}`);
                }
                _files.push(fileStat)
            }
        }
    }

    return _files;
}

/**
 * 
 * @param directoryPath without meta-data
 * @param withLogs 
 * @returns 
 */
export async function getAllPDFFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterExt: [PDF_EXT],
        ignoreFolders: true,
        withLogs
    });
}

export async function getAllZipFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterExt: [ZIP_EXT],
        ignoreFolders: true,
        withLogs
    });
}
/**
 * 
 * @param directoryPath without meta-data
 * @param withLogs 
 * @returns 
 */
export async function getAllPDFFilesWithIgnorePathsSpecified(directoryPath: string,
    ignorePaths = []): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterExt: [PDF_EXT],
        ignoreFolders: true,
        withLogs: false,
        ignorePaths: ignorePaths
    });
}

//expensive operation
export async function getAllPDFFilesWithMedata(directoryPath: string, 
    withLogs: boolean = true, rowCounterController = ""): Promise<FileStats[]> {
    const filestatsOptions =
    {
        directoryPath: directoryPath,
        filterExt: [PDF_EXT],
        ignoreFolders: true,
        withLogs: withLogs,
        withMetadata: false, // initially false
    }
    const withoutStats = await getAllFileStats(filestatsOptions)
    const withStats = await getStatsMetadataIndependently(withoutStats, filestatsOptions, rowCounterController);
    return withStats
}


export async function getAllFileListingWithoutStats(filestatsOptions: FileStatsOptions): Promise<FileStats[]> {
    return await getAllFileStats(
        {
            directoryPath: filestatsOptions.directoryPath,
            filterExt: filestatsOptions.filterExt || [],
            ignorePaths: filestatsOptions.ignorePaths || [],
            ignoreFolders: true,
            withLogs: filestatsOptions.withLogs || true,
            withMetadata: false,
        })
}

export async function getAllFileListingWithFileSizeStats(directoryPath: string): Promise<FileStats[]> {
    return await getAllFileStats(
        {
            directoryPath,
            filterExt: [],
            ignoreFolders: true,
            withLogs: true,
            withMetadata: false,
        })
}

export async function getAllFileListingWithStats(directoryPath: string): Promise<FileStats[]> {
    const filestatsOptions = {
        directoryPath: directoryPath,
        filterExt: [],
        ignoreFolders: true,
        withLogs: false,
        withMetadata: false, //initially false
    }

    const withoutStats = await getAllFileStats(filestatsOptions)
    const withStats = await getStatsMetadataIndependently(withoutStats, filestatsOptions);
    return withStats
}

// hack to make things faster
export async function getStatsMetadataIndependently(withoutStats: FileStats[], 
    filestatsOptions: FileStatsOptions,
    rowCounterController=""): Promise<FileStats[]> {
    let START_TIME = Number(Date.now())
    const promises = withoutStats.map((fileStat: FileStats) => {
        let updatedFileStat = { ...fileStat };
        if (fileStat.ext === PDF_EXT) {
            const pageCountPromise = getPdfPageCountUsingPdfLib(fileStat.absPath);
            pageCountPromise.then(pageCount => {
                updatedFileStat.pageCount = pageCount;
                if (filestatsOptions.withLogs) {
                    console.log(`${fileStat.rowCounter}/${FileConstUtils.getRowCounter(rowCounterController)[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(fileStat.rawSize)}`);
                }
            });
            return pageCountPromise.then(() => updatedFileStat);
        } else {
            updatedFileStat.pageCount = 0;
            return Promise.resolve(updatedFileStat);
        }
    });
    const withStats = await Promise.all(promises);

    let END_TIME = Number(Date.now())
    console.log(`Time Taken for  ${formatTime(END_TIME - START_TIME)}`);
    return withStats
}
