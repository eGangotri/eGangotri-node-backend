import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';
import { formatTime, getAllPdfs } from './Utils';
import { INTRO_PAGE_ADJUSTMENT } from '../index';
import { GENERATION_REPORT } from '../convert';
import { getAllTifs } from './ImgUtils';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */

export async function getPdfPageCount(pdfPath: string) {
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
        console.log(` counter ${++counter}`)
        const copiedPages = await mergedPdf.copyPages(document, document.getPageIndices());
        console.log(` copiedPages ${counter}`)
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        console.log(` copiedPages ${counter}`)

    }

    return await fs.promises.writeFile(pdfName, await mergedPdf.save());
}

export async function mergeAllPdfsInFolder(pdfFolder: string, pdfName: string) {
    const START_TIME = Number(Date.now())
    const pdfs = await getAllPdfs(pdfFolder);
    if (pdfs.length === 1) {
        console.log(`Single PDF merely copy ${pdfFolder}`)
        fs.copyFileSync(pdfs[0], pdfName);
    }
    else {
        console.log(`Merging ${pdfs.length} pdfs in ${pdfFolder}`)
        const pdfForMerge = pdfs.map((x) => {
            return fs.readFileSync(x)
        })
        await mergePDFDocuments(pdfForMerge, pdfName);
    }
    const EMD_TIME = Number(Date.now())
    console.log(`\nTotal Time Taken for pdfmerge ${formatTime(EMD_TIME - START_TIME)}`);
    console.log(`Created pdf from ${pdfs.length} pdf Files: \n\t${pdfName}`)

}

export async function checkPageCountEqualsImgCountInFolderUsingPdfLib(pdfPath: string, folder: string) {
    const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;
    const pngCount = (await getAllTifs(folder)).length
    return checkPageCountEqualsImgCountUsingPdfLib(pdfPath, pngCount);
}

export async function checkPageCountEqualsImgCountUsingPdfLib(pdfPath: string, pngCount: number) {
    const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;

    if (pdfPageCount === pngCount) {
        GENERATION_REPORT.push(`${pdfPath}(${pngCount}) created with PageCount same as png count(${pngCount})`)
    }
    else if (pdfPageCount === -1) {
        GENERATION_REPORT.push(`${pdfPath} is over threshhold size. pls check if same as ${pngCount}`);
    }
    else {
        GENERATION_REPORT.push(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdfPath} !!!`)
    }
    return pdfPageCount === pngCount
}