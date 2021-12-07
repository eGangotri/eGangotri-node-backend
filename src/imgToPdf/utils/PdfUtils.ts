import * as fs from 'fs';
import { getAllPngs } from '../utils/ImgUtils';
import * as path from 'path';
import { GENERATION_REPORT } from '../index';
import { pngFolderName } from './PngUtils';

const PDFMerger = require('pdf-merger-js');
const PDFDocument = require('pdfkit');

const FOOTER_TEXT = 'CC-0. In Public Domain.Kavikulguru Kalidas Sanskrit University Ramtek Collection';
const PDF_FONT = 'Times-Roman';
const FOOTER_LINK = 'https://kksu.org/';
const INTRO_BANNER = 'E:\\KKSU_Banner.jpg';
const ADD_INTRO_PDF = true;
const INTRO_TEXT = `This PDF you are browsing now is a digitized copy of rare books and manuscripts from the Jnanayogi Dr. Shrikant Jichkar Knowledge Resource Center Library located in Kavikula Guru Kalidas Sanskrit University Ramtek, Maharashtra.

Digitization was executed by NMM(https://www.namami.gov.in/)

About KKSU
The University was established on 18 September 1997. KKSU is an institution dedicated to the advanced learning of Sanskrit. It is located at Ramtek in Nagpur District, Maharashtra.
The pdf is offered freely to the Community of Scholars with the intent to promote Sanskrit Learning.

Website
https://kksu.co.in/

Sincerely,

Prof. Shrinivasa Varkhedi
Hon'ble Vice-Chancellor

Dr. Deepak Kapade
Librarian

Digital Uploaded by eGangotri Digital Preservation Trust, New Delhi
https://egangotri.wordpress.com/`

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
    const addIntroAdjustment = ADD_INTRO_PDF ? 1 : 0
    const pdfPageCount = range.start - addIntroAdjustment;
    if (pdfPageCount === pngCount + addIntroAdjustment) {
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