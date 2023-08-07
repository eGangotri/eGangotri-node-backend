import * as fs from 'fs';
import { getPdfPageCountUsingPdfLib } from "./PdfLibUtils";
import { getFilzeSize } from './PdfLibUtils';
const path = require("path")
import * as Mirror from "../../mirror/FrontEndBackendCommonCode"
import { PdfStats } from './types';
import { ellipsis } from '../../mirror/utils';

export let ROW_COUNTER = [0, 0];
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


export async function getAllPDFFiles(directoryPath: string): Promise<PdfStats[]> {
    let pdfFiles: PdfStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            pdfFiles = pdfFiles.concat(await getAllPDFFiles(itemPath));
        } else if (path.extname(itemPath).toLowerCase() === '.pdf') {
            const _path = path.parse(itemPath);
            pdfFiles.push({
                absPath: itemPath,
                folder: _path.dir,
                fileName: _path.base
            })

        }
    }
    return pdfFiles;
}

export async function getAllPDFFilesWithMedata(directoryPath: string): Promise<PdfStats[]> {
    let pdfFiles: PdfStats[] = [];

    // Read all items in the directory
    const items = fs.readdirSync(directoryPath);

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            // Recursively call the function for subdirectories
            pdfFiles = pdfFiles.concat(await getAllPDFFilesWithMedata(itemPath));
        } else if (path.extname(itemPath).toLowerCase() === '.pdf') {
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
                fileName: _path.base
            }
            console.log(`${ROW_COUNTER[0]}/${ROW_COUNTER[1]}). ${JSON.stringify(ellipsis(pdfStats.fileName, 40))} ${pageCount} pages ${Mirror.sizeInfo(rawSize)}`);
            pdfFiles.push(pdfStats)
        }
    }
    return pdfFiles;
}
export function createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created: ${folderPath}`);
    } else {
        // console.log(`Folder already exists: ${folderPath}`);
    }
}



