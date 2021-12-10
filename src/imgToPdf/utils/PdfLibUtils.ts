import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';
import { formatTime, getAllPdfs } from './Utils';
import { INTRO_PAGE_ADJUSTMENT } from './constants';
import { GENERATION_REPORT } from '..';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */

export async function getPdfPageCount(pdfPath:string){
    var stats = fs.statSync(pdfPath)
    let pdfDoc;
    var fileSizeInBytes = stats.size;
    var fileSizeInGB = fileSizeInBytes / (1024*1024*1024);
        if(fileSizeInGB<=2){
            pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
        }
        else return -1
    return pdfDoc.getPages().length

}

export async function mergePDFDocuments(documents:Array<any>, pdfName:string) {
	const mergedPdf = await PDFDocument.create();

	for (let document of documents) {
		document = await PDFDocument.load(document);

		const copiedPages = await mergedPdf.copyPages(document, document.getPageIndices());
		copiedPages.forEach((page) => mergedPdf.addPage(page));    
	}
	
	return await fs.promises.writeFile(pdfName, await mergedPdf.save());
}

export async function mergeAllPdfsInFolder(pdfFolder:string, pdfName:string){
    const START_TIME = Number(Date.now())
    const pdfs = await getAllPdfs(pdfFolder);
    console.log(`pdfs in ${pdfFolder} ${pdfs.join(",")}`)
    const pdfForMerge = pdfs.map( (x) => {
        return fs.readFileSync(x)
    })
    await mergePDFDocuments(pdfForMerge,pdfName);
    const EMD_TIME = Number(Date.now())
    console.log(`\nTotal Time Taken for pdfmerge ${formatTime(EMD_TIME - START_TIME)}`);
    console.log(`Created pdf from ${pdfs.length} pdf Files: \n\t${pdfName}`)

}

export async function checkPageCountEqualsImgCountusingPdfLib(pdfPath:string, pngCount:number){
    const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;
    
    if (pdfPageCount === pngCount) {
        GENERATION_REPORT.push(`${pdfPath}(${pngCount}) created with PageCount same as png count(${pngCount})`)
    }
    else if(pdfPageCount === -1){
        GENERATION_REPORT.push(`${pdfPath} is over threshhold size. pls check if same as ${pngCount}`);
    }
    else {
        GENERATION_REPORT.push(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdfPath} !!!`)
    }
    return pdfPageCount === pngCount
}