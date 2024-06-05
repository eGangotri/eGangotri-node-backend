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
    return await getAllFileStats({
        directoryPath,
        filterPath: PDF_EXT,
        ignoreFolders: true,
        withLogs
    });
}

//expensive operation
export async function getAllPDFFilesWithMedata(directoryPath: string, withLogs: boolean = true): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterPath: PDF_EXT,
        ignoreFolders: true,
        withLogs,
        withMetadata: true
    });
}

//Deprecated
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
    console.log(`fileStatsOptions ${JSON.stringify(fileStatOptions)}`)
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
            _files = _files.concat(await getAllFileStats({
                directoryPath: itemPath,
                filterPath: fileStatOptions.filterPath,
                ignoreFolders: fileStatOptions.ignoreFolders,
                withLogs: fileStatOptions.withLogs,
                withMetadata: fileStatOptions.withMetadata
            }));
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

            console.log(`fileStatOptions.withLogs ${fileStatOptions.withLogs}`)
            console.log(`fileStatOptions.withFileSizeMetadata ${fileStatOptions.withFileSizeMetadata}`)
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
    return await getAllFileStats(
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

export async function getAllFileStatsWithMetadata(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = true): Promise<FileStats[]> {
    return await getAllFileStats({
        directoryPath,
        filterPath,
        ignoreFolders,
        withLogs,
        withMetadata: true
    })
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

export const getDuplicatesBySize = async (folder: string, folder2: string) => {
    const metadata = await getAllFileListingWithFileSizeStats(folder);
    const metadata2 = await getAllFileListingWithFileSizeStats(folder2);

    const duplicates = duplicateBySizeCheck(metadata, metadata2)

    const reverseDuplicates = duplicateBySizeCheck(metadata2, metadata)
    return {
        msg: `${metadata.length} files in ${folder} and ${metadata2.length} files in ${folder2} with ${duplicates.length} duplicates by size.`,
        metadata1Length: metadata.length,
        metadata2Length: metadata2.length,
        diff1: metadata.length - duplicates.length,
        diff2: metadata2.length - reverseDuplicates.length,
        dupLength: duplicates.length,
        revDupLength: reverseDuplicates.length,
        duplicates,
        reverseDuplicates,
    }
}

const duplicateBySizeCheck = (metadata: FileStats[], metadata2: FileStats[]) => {
    const duplicates = [];
    console.log(`metadata ${JSON.stringify(metadata[0].size)} metadata2 ${JSON.stringify(metadata2[0].size)}`)
    metadata.forEach((file: FileStats) => {
        const match = metadata2.find((file2: FileStats) => {
            if (file.rawSize === file2.rawSize) {
                console.log(`rawSize ${file.fileName}(${file.rawSize}) ${file2?.fileName}(${file2?.rawSize})`)
            }
            return file.rawSize === file2.rawSize;
        });
        //console.log(`match ${JSON.stringify(match)}`)
        if (match?.fileName.length > 0) {
            duplicates.push({
                file: file.fileName,
                file2: match?.fileName
            });
        }
    });
    return duplicates;
}
