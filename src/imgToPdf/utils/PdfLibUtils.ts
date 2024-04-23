import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';
import { formatTime, getAllPdfs } from './Utils';
import { PDF_SIZE_LIMITATIONS } from './PdfUtil';
import * as path from 'path';

/**
 *  Only handles files < 2 GB
 */
export async function getPdfPageCountUsingPdfLib(pdfPath: string) {
    try {
        if (getFilzeSize(pdfPath) <= PDF_SIZE_LIMITATIONS) {
            const fileBuffer = await fs.promises.readFile(pdfPath);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            return pdfDoc.getPageCount();
        }
    }
    catch (err) {
        console.log(err)
    }
    return 0;
}

export async function getPdfFirstPageDimensionsUsingPdfLib(pdfPath: string) {
    if (getFilzeSize(pdfPath) <= PDF_SIZE_LIMITATIONS) {
        const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath), { ignoreEncryption: true });
        return [pdfDoc.getPages()[0].getWidth(), pdfDoc.getPages()[0].getHeight()]
    }
    else return [];
}


export function getFilzeSize(pdfPath: string) {
    let stats = fs.statSync(pdfPath)
    let fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}

export async function mergePDFDocuments(documents: Array<any>, pdfName: string) {
    const mergedPdf = await PDFDocument.create();
    let counter = 0
    for (let document of documents) {
        document = await PDFDocument.load(document, { ignoreEncryption: true });
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
    mergePdfsInList([pdfs], pdfName);
}
