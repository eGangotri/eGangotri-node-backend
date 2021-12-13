import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';
import { formatTime, getAllPdfs } from './Utils';
import { addReport, INTRO_PAGE_ADJUSTMENT } from '../index';
import { getAllTifs } from './ImgUtils';
import * as path from 'path';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */


export async function getPdfPageCountUsingPdfLib(pdfPath: string) {
    if (getFilzeSize(pdfPath) <= 2) {
        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
        return pdfDoc.getPages().length
    }
    else return -1;
}


export function getFilzeSize(pdfPath: string) {
    let stats = fs.statSync(pdfPath)
    let fileSizeInBytes = stats.size;
    return fileSizeInBytes / (1024 * 1024 * 1024);
}
export async function mergePDFDocuments(documents: Array<any>, pdfName: string) {
    const mergedPdf = await PDFDocument.create();
    let counter = 0
    for (let document of documents) {
        document = await PDFDocument.load(document);
        const copiedPages = await mergedPdf.copyPages(document, document.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        console.log(` copiedPage ${++counter} to ${path.parse(pdfName).name}`)

    }

    return await fs.promises.writeFile(pdfName, await mergedPdf.save());
}

export async function mergePdfsInList(pdfFolders: Array<any>, pdfName: string) {
    const flattened = pdfFolders.flat(1);
    const START_TIME = Number(Date.now())
    if (flattened.length === 1) {
        console.log(`Single PDF merely copy ${flattened}`)
        fs.copyFileSync(flattened[0], pdfName);
    }
    else {
        console.log(`Merging ${flattened.length} pdfs from  ${pdfFolders.length} Folders`)
        const pdfForMerge = flattened.map((x) => {
            return fs.readFileSync(x)
        })
        await mergePDFDocuments(pdfForMerge, pdfName);
    }
    const EMD_TIME = Number(Date.now())
    console.log(`\nTotal Time Taken for pdfmerge ${formatTime(EMD_TIME - START_TIME)}`);
    console.log(`Created pdf from ${flattened.length} pdf Files: \n\t${pdfName}`)

}

export async function mergeAllPdfsInFolder(pdfFolder: string, pdfName: string) {
    const pdfs = await getAllPdfs(pdfFolder);
    mergePdfsInList([pdfs],pdfName);
}
