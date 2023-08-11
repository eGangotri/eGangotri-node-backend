import * as fs from 'fs';
import { getPdfPageCountUsingPdfLib } from "./PdfLibUtils";
import { getFilzeSize } from './PdfLibUtils'; 4
import * as path from 'path';
import * as Mirror from "../../mirror/FrontEndBackendCommonCode"
import { FileStats } from './types';
import { ellipsis } from '../../mirror/utils';
import _ from 'lodash';
import { PDF_EXT } from './constants';

export let ROW_COUNTER = [1, 0];
export const incrementRowCounter = () => { ROW_COUNTER = [++ROW_COUNTER[0], 0] }

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
 * export async function getAllPDFFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    let pdfFiles: FileStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            pdfFiles = pdfFiles.concat(await getAllPDFFiles(itemPath, withLogs));
        } else if (path.extname(itemPath).toLowerCase() === '.pdf') {
            const _path = path.parse(itemPath);
            pdfFiles.push({
                rowCounter: ++ROW_COUNTER[1],
                absPath: itemPath,
                folder: _path.dir,
                fileName: _path.base
            })
            if (withLogs) {
                console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(_path.base, 40))}`);
            }
        }
    }
    return pdfFiles;
}

 */

export async function getAllPDFFiles(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats(directoryPath, PDF_EXT, true, withLogs);
}

export async function getAllPDFFilesWithMedata(directoryPath: string, withLogs: boolean = false): Promise<FileStats[]> {
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
export async function getAllFileStats(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = false,
    withMetadata: boolean = false): Promise<FileStats[]> {
    let _files: FileStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            if (!ignoreFolders) {
                const _path = path.parse(itemPath);
                _files.push({
                    rowCounter: ++ROW_COUNTER[1],
                    absPath: itemPath,
                    folder: _path.dir,
                    fileName: _path.base,
                    ext: "FOLDER"
                })
            }
            _files = _files.concat(await getAllFileStats(itemPath, filterPath, ignoreFolders, withLogs, withMetadata));
        } else {
            const ext = path.extname(itemPath);
            if (!_.isEmpty(filterPath) && (ext.toLowerCase() !== filterPath)) {
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
            if (withMetadata) {
                try {
                    const rawSize = getFilzeSize(itemPath);
                    const pageCount = await getPdfPageCountUsingPdfLib(itemPath)
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
            else {
                if (withLogs) {
                    console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(fileStat.fileName, 40))}`);
                }
            }
            _files.push(fileStat)
        }
    }
    return _files;
}

export async function getAllFileStatsWithMetadata(directoryPath: string,
    filterPath: string = "",
    ignoreFolders: boolean = false,
    withLogs: boolean = false): Promise<FileStats[]> {
    return await getAllFileStats(directoryPath,
        filterPath,
        ignoreFolders,
        withLogs, true)
}
/*
export async function getAllPDFFilesWithMedata(directoryPath: string): Promise<FileStats[]> {
    let pdfFiles: FileStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        const ext = path.extname(itemPath);

        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            pdfFiles = pdfFiles.concat(await getAllPDFFilesWithMedata(itemPath));
        } else if (ext.toLowerCase() === PDF_EXT) {

            // Add PDF files to the array
            const _path = path.parse(itemPath);
            const rawSize = getFilzeSize(itemPath);
            const pageCount = await getPdfPageCountUsingPdfLib(itemPath)
            const pdfStats = {
                rowCounter: ++ROW_COUNTER[1],
                pageCount,
                rawSize,
                size: Mirror.sizeInfo(rawSize),
                absPath: itemPath,
                folder: _path.dir,
                fileName: _path.base,
                ext: ext
            }
            console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(pdfStats.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(rawSize)}`);
            pdfFiles.push(pdfStats)
        }
    }
    return pdfFiles;
}
*/
export function createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created: ${folderPath}`);
    } else {
        // console.log(`Folder already exists: ${folderPath}`);
    }
}



