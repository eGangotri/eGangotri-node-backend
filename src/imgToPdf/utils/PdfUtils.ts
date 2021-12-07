import * as fs from 'fs';
import { deleteAllPngs, getAllPngs, getAllTifs } from '../utils/ImgUtils';
import * as path from 'path';
import { GENERATION_REPORT } from '../TifToPdf';
import { pngFolderName } from './PngUtils';

const PDFMerger = require('pdf-merger-js');
const PDFDocument = require('pdfkit');

const FOOTER_TEXT = 'CC-0. Kavikulguru Kalidas Sanskrit University Ramtek Collection';
const FOOTER_FONT = 'Times-Roman';
const FOOTER_LINK = 'https://kksu.org/';
const INTRO_PDF = 'E:\\KKSU.pdf';

//https://pdfkit.org/docs/text.html
export async function createPdf(src:string, dest: string) {
    const _pngs = await getAllPngs(pngFolderName(src,dest));
    const pdf = dest + "\\" + path.parse(src).name + ".pdf";
    console.log(`pdfName ${pdf}`)
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    doc.pipe(fs.createWriteStream(pdf)); // write to PDF

    for (let png of _pngs) {
        let img = doc.openImage(png);
        doc.addPage({ size: [img.width, img.height] });
        doc.image(img, 0, 0)
        addFooter(doc)
    }

    // finalize the PDF and end the stream
    doc.end();
    console.log(`${pdf} created`)
    if(checkPageCountAndLogReport(doc, pdf, _pngs.length)){
        //await mergepPdfs(pdf)
    }
}

function calculateFontSize(pageHeight:number){
    const fontSize =  pageHeight*0.02 > 12 ? pageHeight*0.02: 12;
    return fontSize;
}

function addFooter(doc:any){
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const pageHeight = doc.page.height
    const yCoordinate = pageHeight * 0.95
    doc.font(FOOTER_FONT).fontSize(calculateFontSize(pageHeight))
        .fillColor('black')
        .text(FOOTER_TEXT, 0, yCoordinate, {
            link: FOOTER_LINK,
            align: 'center'
        });
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

function checkPageCountAndLogReport(doc: any,pdf:string,  pngCount:number) {
    const range = doc.bufferedPageRange();
    if (range.start === pngCount) {
        GENERATION_REPORT.push(`${pdf}(${pngCount}) created with PageCount same as png count`)
    }
    else {
        GENERATION_REPORT.push(`***Error${pdf}(${pngCount}) created with PageCount wrong!!!`)
    }
    console.log(GENERATION_REPORT)
    return range.start === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(src:string,dest: string) {
    await createPdf(src, dest);
    console.log("after pdf creation. Now delete all generated .pngs")
    await deleteAllPngs(pngFolderName(src,dest));
}

export async function mergepPdfs(pdf:string){
 const merger = new PDFMerger();
 console.log(`merging ${INTRO_PDF}`)
  merger.add(INTRO_PDF); 
  merger.add(pdf); 
  await merger.save(pdf + "x.pdf"); //save under given name and reset the internal document
}