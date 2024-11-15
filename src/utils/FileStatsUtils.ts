import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

import { getPdfPageCountUsingPdfLib } from "../imgToPdf/utils/PdfLibUtils";
import { getFilzeSize } from '../mirror/FrontEndBackendCommonCode';
import * as path from 'path';
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import { FileStatsOptions } from '../imgToPdf/utils/types';
import { ellipsis } from '../mirror/utils';
import _ from 'lodash';
import { PDF_EXT, ZIP_EXT } from '../imgToPdf/utils/constants';

import { FileStats } from "imgToPdf/utils/types";
import { file } from 'pdfkit';
import { formatTime } from '../imgToPdf/utils/Utils';
import { resetRowCounter, ROW_COUNTER } from './constants';


export async function getAllFileStats(filestatsOptions: FileStatsOptions): Promise<FileStats[]> {
    resetRowCounter()
    const queue = [filestatsOptions.directoryPath];
    let _files: FileStats[] = [];

    while (queue.length > 0) {
        const currentDir = queue.shift();
        const dirContent = await fsPromise.readdir(currentDir, { withFileTypes: true });

        for (const dirent of dirContent) {
            const fullPath = path.join(currentDir, dirent.name);

            if (filestatsOptions?.ignorePaths && filestatsOptions?.ignorePaths?.some((item: string) => fullPath.includes(item))) {
                console.log(`Ignoring ${fullPath} due to ${filestatsOptions?.ignorePaths}`);
                continue;
            }
            // console.log(`not Ignoring ${fullPath} due to ${filestatsOptions?.ignorePaths}`);

            if (dirent.isDirectory()) {
                queue.push(fullPath);
                if (!filestatsOptions.ignoreFolders) {
                    const _path = path.parse(fullPath);
                    _files.push({
                        rowCounter: ++ROW_COUNTER[1],
                        absPath: fullPath,
                        folder: _path.dir,
                        fileName: _path.base,
                        ext: "FOLDER"
                    })
                }
            } else if (dirent.isFile()) {
                const ext = path.extname(fullPath);
                if (!_.isEmpty(filestatsOptions.filterExt) &&
                    (filestatsOptions?.filterExt?.every((item: string) => ext.toLowerCase() !== item))) {
                    continue;
                }
                const _path = path.parse(fullPath);
                const rawSize = getFilzeSize(fullPath) || 0;

                let fileStat: FileStats = {
                    rowCounter: ++ROW_COUNTER[1],
                    absPath: fullPath,
                    folder: _path.dir,
                    fileName: _path.base,
                    ext,
                    rawSize,
                    size: Mirror.sizeInfo(rawSize),
                }

                if (filestatsOptions.withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${Mirror.sizeInfo(rawSize)}`);
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
export async function getAllPDFFilesWithMedata(directoryPath: string, withLogs: boolean = true): Promise<FileStats[]> {
    const filestatsOptions =
    {
        directoryPath: directoryPath,
        filterExt: [PDF_EXT],
        ignoreFolders: true,
        withLogs: withLogs,
        withMetadata: false, // initially false
    }
    const withoutStats = await getAllFileStats(filestatsOptions)
    const withStats = await getStatsMetadataIndependently(withoutStats, filestatsOptions);
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
export async function getStatsMetadataIndependently(withoutStats: FileStats[], filestatsOptions: FileStatsOptions): Promise<FileStats[]> {
    let START_TIME = Number(Date.now())
    const promises = withoutStats.map((fileStat: FileStats) => {
        let updatedFileStat = { ...fileStat };
        if (fileStat.ext === PDF_EXT) {
            const pageCountPromise = getPdfPageCountUsingPdfLib(fileStat.absPath);
            pageCountPromise.then(pageCount => {
                updatedFileStat.pageCount = pageCount;
                if (filestatsOptions.withLogs) {
                    console.log(`${fileStat.rowCounter}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(fileStat.rawSize)}`);
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
