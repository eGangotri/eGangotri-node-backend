import * as fs from 'fs';
import { getAllPngs } from '../utils/ImgUtils';
import * as path from 'path';
import { GENERATION_REPORT } from '../index';
import { pngFolderName } from './PngUtils';
import { ADD_INTRO_PDF, FOOTER_LINK, FOOTER_TEXT, INTRO_BANNER, INTRO_PAGE_ADJUSTMENT, INTRO_TEXT, PDF_FONT } from './constants';

const PDFMerger = require('pdf-merger-js');
const PDFDocument = require('pdfkit');


//https://pdfkit.org/docs/text.html
export async function createPdf(src: string, dest: string) {
    const _pngs = await getAllPngs(pngFolderName(src, dest));
    const pdf = dest + "\\" + path.parse(src).name + ".pdf";
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    doc.pipe(fs.createWriteStream(pdf)); // write to PDF

    let introPDFAdded = false
    for (let png of _pngs) {
        let img = doc.openImage(png);
        if (!introPDFAdded && ADD_INTRO_PDF) {
            introPDFAdded = true;
            addBanner(doc, img);
        }
        doc.addPage({ size: [img.width, img.height] });
        doc.image(img, 0, 0)
        addFooter(doc)
    }

    // finalize the PDF and end the stream
    doc.end();
    console.log(`Created pdf from ${_pngs.length} Image Files: \n\t${pdf}`)
    checkPageCountEqualsImgCount(doc, pdf, _pngs.length);
}

function addBanner(doc: any, img: any) {
    doc.addPage({ size: [img.width, img.height] });
    const banner = doc.openImage(INTRO_BANNER)
    doc.image(banner, doc.page.margins.left, doc.page.margins.top, 
        { width: doc.page.width - (doc.page.margins.left+doc.page.margins.right),
          height: doc.page.height*0.31 - (doc.page.margins.top+doc.page.margins.bottom)
        })
        doc.moveDown();
    doc.font(PDF_FONT).fontSize(calculateFontSize(img.height))
        .fillColor('black')
        .text(INTRO_TEXT, doc.page.margins.left, doc.page.height*0.31, {
            align: 'left'
        });
    addFooter(doc);
}

function calculateFontSize(pageHeight: number, ratio:number = 0.02) {
    return (pageHeight * ratio > 14) ? pageHeight * ratio : 14;
}

function footerFontSize(pageHeight: number) {
    return calculateFontSize(pageHeight, 0.015);
}

function addFooter(doc: any) {
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const pageHeight = doc.page.height
    const yCoordinate = pageHeight * 0.95
    doc.font(PDF_FONT).fontSize(footerFontSize(pageHeight))
        .fillColor('black')
        .text(FOOTER_TEXT, 0, yCoordinate, {
            link: FOOTER_LINK,
            align: 'center'
        });
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

function checkPageCountEqualsImgCount(doc: any, pdf: string, pngCount: number) {
    const range = doc.bufferedPageRange();
    const pdfPageCount = range.start - INTRO_PAGE_ADJUSTMENT;
    if (pdfPageCount === pngCount) {
        GENERATION_REPORT.push(`${pdf}(${pngCount}) created with PageCount same as png count`)
    }
    else {
        GENERATION_REPORT.push(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdf} !!!`)
    }
    return pdfPageCount === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(src: string, dest: string) {
    await createPdf(src, dest);
    fs.rmSync(pngFolderName(src,dest), { recursive: true, force: true });
}

export async function mergepPdfs(pdf: string, INTRO_PDF: string) {
    const merger = new PDFMerger();
    console.log(`merging ${INTRO_PDF}`)
    merger.add(INTRO_PDF);
    merger.add(pdf);
    await merger.save(pdf + "x.pdf"); //save under given name and reset the internal document
}