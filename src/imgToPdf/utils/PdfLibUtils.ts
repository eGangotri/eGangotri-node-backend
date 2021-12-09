import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';
import { formatTime, getAllPdfs } from './Utils';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */

export async function getPdfPageCount(pdfPath:string){
    var stats = fs.statSync(pdfPath)
    var fileSizeInBytes = stats.size;
    var fileSizeInGB = fileSizeInBytes / (1024*1024*1024);
        if(fileSizeInGB<=2){
            const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
            return pdfDoc.getPages().length
        }
        else return -1
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
    //checkPageCountEqualsImgCount(doc, pdf, _pngs.length);

}