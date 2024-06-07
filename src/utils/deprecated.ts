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
import { getAllFileStats } from './FileStatsUtils';

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
            if (fileStatOptions.withMetadata) {
                try {
                    let pageCount = 0;
                    if (itemPath.endsWith(".pdf")) {
                        pageCount = await getPdfPageCountUsingPdfLib(itemPath)
                        fileStat = {
                            ...fileStat,
                            pageCount: pageCount,
                        }
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
