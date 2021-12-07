import * as fs from 'fs';
import { deleteAllPngs, getAllPngs, getAllTifs } from '../utils/ImgUtils';
import * as path from 'path';
import { GENERATION_REPORT } from '../TifToPdf';
import { pngFolderName } from './PngUtils';

const PDFMerger = require('pdf-merger-js');
const PDFDocument = require('pdfkit');

const FOOTER_TEXT = 'CC-0. Kavikulguru Kalidas Sanskrit University Ramtek Collection';
const PDF_FONT = 'Times-Roman';
const FOOTER_LINK = 'https://kksu.org/';
const INTRO_BANNER = 'E:\\KKSU_Banner.jpg';
const ADD_INTRO_PDF = true;
const INTRO_TEXT = `This PDF you are browsing now is a digitized copy of Rare books and manuscripts from the Jnanayogi Dr. Shrikant Jichkar Knowledge Resource Center Library located in Kavikula Guru Kalidas Sanskrit University Ramtek, Maharashtra.


About KKSU
The University was established on 18 September 1997. It is named to pay rich tribute to Legendary Sanskrit Mahakavi Kalidas. KKSU is an institution dedicated to the advanced learning of Sanskrit. It is located at Ramtek which falls under Nagpur District, the second capital of Maharashtra. KKSU is the First Sanskrit University of Maharashtra.
The pdf is offered to the Community of Scholars free of charge without restrictions.

Website
https://kksu.co.in/`

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
    console.log(`Created \n\t${pdf}/`)
    checkPageCountAndLogReport(doc, pdf, _pngs.length);
}

function addBanner(doc: any, img: any) {
    doc.addPage({ size: [img.width, img.height] });
    const banner = doc.openImage(INTRO_BANNER)
    doc.image(banner, doc.page.margins.left, doc.page.margins.top, 
        { width: img.width - ( doc.page.margins.left+doc.page.margins.right) })
        doc.moveDown();

    doc.font(PDF_FONT).fontSize(calculateFontSize(img.height))
        .fillColor('black')
        .text(INTRO_TEXT, doc.page.margins.left, banner.height + doc.page.margins.top + (img.height * 0.2), {
            align: 'left'
        });
    addFooter(doc);
}

function calculateFontSize(pageHeight: number) {
    const fontSize = pageHeight * 0.02 > 12 ? pageHeight * 0.02 : 12;
    return fontSize;
}

function addFooter(doc: any) {
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const pageHeight = doc.page.height
    const yCoordinate = pageHeight * 0.95
    doc.font(PDF_FONT).fontSize(calculateFontSize(pageHeight))
        .fillColor('black')
        .text(FOOTER_TEXT, 0, yCoordinate, {
            link: FOOTER_LINK,
            align: 'center'
        });
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

function checkPageCountAndLogReport(doc: any, pdf: string, pngCount: number) {
    const range = doc.bufferedPageRange();
    if (range.start === pngCount + (ADD_INTRO_PDF ? 1 : 0)) {
        GENERATION_REPORT.push(`${pdf}(${pngCount + (ADD_INTRO_PDF ? 1 : 0)}) created with PageCount same as png count`)
    }
    else {
        GENERATION_REPORT.push(`***Error${pdf}(${pngCount + (ADD_INTRO_PDF ? 1 : 0)}) created with PageCount wrong!!!`)
    }
    console.log(GENERATION_REPORT)
    return range.start === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(src: string, dest: string) {
    await createPdf(src, dest);
    console.log("after pdf creation. Now delete all generated .pngs")
    await deleteAllPngs(pngFolderName(src, dest));
}

export async function mergepPdfs(pdf: string, INTRO_PDF: string) {
    const merger = new PDFMerger();
    console.log(`merging ${INTRO_PDF}`)
    merger.add(INTRO_PDF);
    merger.add(pdf);
    await merger.save(pdf + "x.pdf"); //save under given name and reset the internal document
}