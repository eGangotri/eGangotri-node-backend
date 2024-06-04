import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

import { getPdfPageCountUsingPdfLib } from "./PdfLibUtils";
import { getFilzeSize } from '../../mirror/FrontEndBackendCommonCode';
import * as path from 'path';
import * as Mirror from "../../mirror/FrontEndBackendCommonCode"
import { FileStats, FileStatsOptions } from './types';
import { ellipsis } from '../../mirror/utils';
import _ from 'lodash';
import { PDF_EXT } from './constants';

export let ROW_COUNTER = [1, 0];
export const incrementRowCounter = () => { ROW_COUNTER = [++ROW_COUNTER[0], 0] }
export const resetRowCounter = () => { ROW_COUNTER = [1, 0] }

export function removeFolderWithContents(folder: string) {
    fs.rm(folder, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
    })
}

export const removeExcept = async (folder: any, except: Array<string>) => {
    const contentList = await fs.promises.readdir(folder)
    const files = contentList.map((x) => folder + "\\" + x).filter((y) => {
        console.log(`Found ${y}`)
        return !except.includes(y)
    }).map(e => fs.unlink(e, (err) => {
        if (err) throw err;
        console.log(`${e} was deleted`);
    }))

}

/**
 * 
 * @param directoryPath without meta-data
 * @param withLogs 
 * @returns 
 */
export async function getAllPDFFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats(directoryPath, PDF_EXT, true, withLogs);
}

//expensive operation
export async function getAllPDFFilesWithMedata(directoryPath: string, withLogs: boolean = true): Promise<FileStats[]> {
    return await getAllFileStats(directoryPath, PDF_EXT, true, withLogs, true);
}

/**
 * 
 * @param directoryPath 
 * @param filterPath like ".pdf"
 * @param ignoreFolders 
 * @param withLogs 
 * @param withMetadata 
 * @returns 
 */
export async function getAllFileStatsSync(
    fileStatOptions: FileStatsOptions
): Promise<FileStats[]> {
    let _files: FileStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(fileStatOptions.directoryPath);

    for (const item of items) {
        const itemPath = path.join(fileStatOptions.directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            if (!fileStatOptions.ignoreFolders) {
                const _path = path.parse(itemPath);
                _files.push({
                    rowCounter: ++ROW_COUNTER[1],
                    absPath: itemPath,
                    folder: _path.dir,
                    fileName: _path.base,
                    ext: "FOLDER"
                })
            }
            _files = _files.concat(await getAllFileStats(itemPath, fileStatOptions.filterPath, 
                fileStatOptions.ignoreFolders, 
                fileStatOptions.withLogs, 
                fileStatOptions.withMetadata));
        } else {
            const ext = path.extname(itemPath);
            if (!_.isEmpty(fileStatOptions.filterPath) && (ext.toLowerCase() !== fileStatOptions.filterPath)) {
                continue;
            }
            const _path = path.parse(itemPath);
            let fileStat: FileStats = {
                rowCounter: ++ROW_COUNTER[1],
                absPath: itemPath,
                folder: _path.dir,
                fileName: _path.base,
                ext
            }

            if (fileStatOptions.withFileSizeMetadata) {
                const rawSize = getFilzeSize(itemPath);
                fileStat = {
                    ...fileStat,
                    rawSize,
                    size: Mirror.sizeInfo(rawSize),
                }

                if (fileStatOptions.withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${Mirror.sizeInfo(fileStat.rawSize)}`);
                }
            }
            if (fileStatOptions.withMetadata) {
                try {
                    const pageCount = await getPdfPageCountUsingPdfLib(itemPath)
                    fileStat = {
                        ...fileStat,
                        pageCount: pageCount,
                    }
                    if (fileStatOptions.withLogs) {
                        console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(fileStat.rawSize)}`);
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
            else {
                if (fileStatOptions.withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))}`);
                }
            }
            _files.push(fileStat)
        }
    }
    return _files;
}

export async function getAllFileListingWithoutStats(directoryPath: string): Promise<FileStats[]> {
    return await getAllFileStatsSync(
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
    return await getAllFileStatsSync(
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
    return await getAllFileStatsSync(
        {
            directoryPath,
            filterPath: "",
            ignoreFolders: true,
            withLogs: false,
            withMetadata: true,
            withFileSizeMetadata: false
        })
}

export async function getAllFileStats(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = false,
    withMetadata: boolean = false): Promise<FileStats[]> {

    const queue = [directoryPath];
    let _files: FileStats[] = [];

    while (queue.length > 0) {
        const currentDir = queue.shift();
        const dirContent = await fsPromise.readdir(currentDir, { withFileTypes: true });

        for (const dirent of dirContent) {
            const fullPath = path.join(currentDir, dirent.name);
            if (dirent.isDirectory()) {
                queue.push(fullPath);
                if (!ignoreFolders) {
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
                if (!_.isEmpty(filterPath) && (ext.toLowerCase() !== filterPath)) {
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
                if (withMetadata) {
                    try {
                        const rawSize = getFilzeSize(fullPath);
                        const pageCount = await getPdfPageCountUsingPdfLib(fullPath)
                        fileStat = {
                            ...fileStat,
                            pageCount: pageCount,
                            rawSize,
                            size: Mirror.sizeInfo(rawSize),
                        }
                        if (withLogs) {
                            console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(rawSize)}`);
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
                else if (withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))}`);
                }
                _files.push(fileStat)
            }
        }
    }

    return _files;
}

export async function getAllFileStatsWithMetadata(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = true): Promise<FileStats[]> {
    return await getAllFileStats(directoryPath,
        filterPath,
        ignoreFolders,
        withLogs, true)
}

export function createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created: ${folderPath}`);
    } else {
        // console.log(`Folder already exists: ${folderPath}`);
    }
}

export const checkIfEmpty = async (srcPath: string) => {
    let empty = true;
    if (srcPath) {
        try {
            const files = await fsPromise.readdir(srcPath);
            for (let file of files) {
                if ((await fsPromise.stat(path.join(srcPath, file))).isFile()) {
                    empty = false;
                    console.log('The directory has at least one file.');
                    break;
                }
            }
        } catch (err) {
            console.error(`Error reading directory: ${err}`);
        }
    } else {
        console.log('srcPath is empty.');
    }
    console.log(`emptyFolder ${empty}`);
    return empty;
}
