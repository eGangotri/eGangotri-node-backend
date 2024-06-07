import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

import { getPdfPageCountUsingPdfLib } from "../imgToPdf/utils/PdfLibUtils";
import { getFilzeSize } from '../mirror/FrontEndBackendCommonCode';
import * as path from 'path';
import * as Mirror from "../mirror/FrontEndBackendCommonCode"
import { FileStatsOptions } from '../imgToPdf/utils/types';
import { ellipsis } from '../mirror/utils';
import _ from 'lodash';
import { PDF_EXT } from '../imgToPdf/utils/constants';

import { FileStats } from "imgToPdf/utils/types";
import { file } from 'pdfkit';
import { formatTime } from '../imgToPdf/utils/Utils';
import { resetRowCounter, ROW_COUNTER } from './constants';


/**
 * 
 * @param directoryPath without meta-data
 * @param withLogs 
 * @returns 
 */
export async function getAllPDFFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterPath: PDF_EXT,
        ignoreFolders: true,
        withLogs
    });
}

//expensive operation
export async function getAllPDFFilesWithMedata(directoryPath: string, withLogs: boolean = true): Promise<FileStats[]> {
    const filestatsOptions =
    {
        directoryPath: directoryPath,
        filterPath: PDF_EXT,
        ignoreFolders: true,
        withLogs: withLogs,
        withMetadata: false,
        withFileSizeMetadata: true
    }
    const withoutStats = await getAllFileStats(filestatsOptions)
    const withStats = await getStatsMetadataIndependently(withoutStats, filestatsOptions);
    return withStats
}


export async function getAllFileListingWithoutStats(directoryPath: string): Promise<FileStats[]> {
    resetRowCounter()
    return await getAllFileStats(
        {
            directoryPath,
            filterPath: "",
            ignoreFolders: true,
            withLogs: true,
            withMetadata: false,
            withFileSizeMetadata: false
        })
}

export async function getAllFileListingWithFileSizeStats(directoryPath: string): Promise<FileStats[]> {
    resetRowCounter()
    return await getAllFileStats(
        {
            directoryPath,
            filterPath: "",
            ignoreFolders: true,
            withLogs: true,
            withMetadata: false,
            withFileSizeMetadata: true
        })
}

export async function getAllFileListingWithStats(directoryPath: string): Promise<FileStats[]> {
    resetRowCounter()
    return await getAllFileStatsWithMetadata(
        {
            directoryPath,
            filterPath: "",
            ignoreFolders: true,
            withLogs: false,
            withMetadata: true,
            withFileSizeMetadata: false
        })
}

export async function getAllFileStats(filestatsOptions: FileStatsOptions): Promise<FileStats[]> {

    const queue = [filestatsOptions.directoryPath];
    let _files: FileStats[] = [];

    while (queue.length > 0) {
        const currentDir = queue.shift();
        const dirContent = await fsPromise.readdir(currentDir, { withFileTypes: true });

        for (const dirent of dirContent) {
            const fullPath = path.join(currentDir, dirent.name);
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
                if (!_.isEmpty(filestatsOptions.filterPath) && (ext.toLowerCase() !== filestatsOptions.filterPath)) {
                    continue;
                }
                const _path = path.parse(fullPath);
                let fileStat: FileStats = {
                    rowCounter: ++ROW_COUNTER[1],
                    absPath: fullPath,
                    folder: _path.dir,
                    fileName: _path.base,
                    ext
                }
                if (filestatsOptions.withFileSizeMetadata) {
                    const rawSize = getFilzeSize(fullPath);
                    fileStat = {
                        ...fileStat,
                        rawSize,
                        size: Mirror.sizeInfo(rawSize),
                    }
                    if (filestatsOptions.withLogs) {
                        console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${Mirror.sizeInfo(rawSize)}`);
                    }
                }
                if (filestatsOptions.withMetadata) {
                    try {
                        const pageCount = await getPdfPageCountUsingPdfLib(fullPath)
                        fileStat = {
                            ...fileStat,
                            pageCount: pageCount,
                        }
                        if (filestatsOptions.withLogs) {
                            console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${pageCount} pages }`);
                        }
                    }
                    catch (err) {
                        fileStat = {
                            ...fileStat,
                            pageCount: 0,
                            rawSize: 0,
                            size: Mirror.sizeInfo(0),
                            ext: "Error reading file"
                        }
                        console.log(`*****${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} Error reading File`, err);
                    }
                }
                else if (filestatsOptions.withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))}`);
                }
                _files.push(fileStat)
            }
        }
    }

    return _files;
}

export async function getAllFileStatsWithMetadata(filestatsOptions: FileStatsOptions): Promise<FileStats[]> {
    const withoutStats = await getAllFileStats(
        {
            directoryPath: filestatsOptions.directoryPath,
            filterPath: "",
            ignoreFolders: true,
            withLogs: false,
            withMetadata: false,
            withFileSizeMetadata: false
        })

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
