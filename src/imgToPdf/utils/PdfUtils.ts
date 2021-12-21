import * as fs from 'fs';
import { getAllPngs } from '../utils/ImgUtils';
import * as path from 'path';
import { addReport } from '../index';
import { PDF_EXT } from './constants';
import { FOOTER_LINK, FOOTER_TEXT, INTRO_BANNER, INTRO_TEXT, PDF_FONT } from './PdfDecoratorUtils';
import { chunk, garbageCollect, heapStats } from './Utils';
import { ADD_INTRO_PDF, INTRO_PAGE_ADJUSTMENT } from '..';
const PDFDocument = require('pdfkit');

const DOT_SUM_PDF_NAME = "SUM.pdf"
let DEFAULT_PDF_WIDTH = 300
let DEFAULT_PDF_HEIGHT = 500
//https://pdfkit.org/docs/text.html
export async function createPdf(pngSrc: string, pdfDestFolder: string, firstPageNeedingIntro = false) {
    if (!fs.existsSync(pdfDestFolder)) {
        fs.mkdirSync(pdfDestFolder);
    }
    const _pngs = await getAllPngs(pngSrc);
    if (_pngs?.length) {
        let counter = 0;
        await pngToPdf(_pngs[0], pdfDestFolder, path.parse(_pngs[0]).name + PDF_EXT, firstPageNeedingIntro);

        for (let png of _pngs.slice(1)) {
            // console.log(`processing 
            // ${png} to
            // ${pdf}
            // `);
            await pngToPdf(png, pdfDestFolder, path.parse(png).name + PDF_EXT);
            counter++
            if (counter % 75 === 0 || counter === _pngs.length) {
                garbageCollect()
            }
        }
    }
}
export async function createRedundantPdf(pdfPath: string) {
    const doc = prepareDocument(pdfPath , `redundant${Number(Date.now())}.pdf`)
    doc.addPage();
    doc.text("redundant");
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
}

export function prepareDocument(pdfPath: string, pdfName:string)
{
    if (!fs.existsSync(pdfPath)) {
        fs.mkdirSync(pdfPath)
    }
    const pdfPathWithName = `${pdfPath}//${pdfName}`
    const doc = new PDFDocument({ autoFirstPage: false });
    var buffers: Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        fs.writeFileSync(pdfPathWithName, Buffer.concat(buffers));
    });
    doc.on("error", (err: any) => console.log("error" + err));
    return doc
}
export async function createPdfFromDotSum(dotSumText: String, pdfDumpFolder: string) {
    const doc = prepareDocument(pdfDumpFolder,DOT_SUM_PDF_NAME)

    const fontSize = calculateFontSize(DEFAULT_PDF_HEIGHT)
    const lines = dotSumText.split(/\r?\n/);
    const numberOfLines = Math.floor(DEFAULT_PDF_HEIGHT*0.009)
    const chunkedLines = chunk(lines, numberOfLines )
    for(let line of chunkedLines){
    const chunkedLineWithNewLine = line.map((x)=>`${x}\n`);
        doc.addPage({ size: [DEFAULT_PDF_WIDTH, DEFAULT_PDF_HEIGHT] });
        doc.font(PDF_FONT).fontSize(fontSize)
        .fillColor('black')
        .text(chunkedLineWithNewLine, doc.page.margins.left, doc.page.margins.top)
        addFooter(doc)
    }

    doc.save()
    doc.end();
}


export async function pngToPdf(pngSrc: string, pdfDumpFolder:string,
     pdfName: string, firstPageNeedingIntro = false) {
    const doc = prepareDocument(pdfDumpFolder, pdfName);
    console.log(`pngToPdf ${pngSrc} pdfName ${pdfName} `)
    let img = doc.openImage(pngSrc);
    DEFAULT_PDF_WIDTH = img.width
    DEFAULT_PDF_HEIGHT = img.height
    if (firstPageNeedingIntro) {
        addBanner(doc, img);
    }
    doc.addPage({ size: [img.width, img.height] });
    doc.image(img, 0, 0)
    addFooter(doc)
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
}

function addBanner(doc: any, img: any) {
    doc.addPage({ size: [img.width, img.height] });
    const banner = doc.openImage(INTRO_BANNER)
    doc.image(banner, doc.page.margins.left, doc.page.margins.top,
        {
            width: doc.page.width - (doc.page.margins.left + doc.page.margins.right),
            height: doc.page.height * 0.31 - (doc.page.margins.top + doc.page.margins.bottom)
        })
    doc.font(PDF_FONT).fontSize(calculateFontSize(img.height))
    .fillColor('black')
    .text(INTRO_TEXT, doc.page.margins.left, doc.page.height * 0.31, {
        align: 'left'
    })
    addFooter(doc);
}

function calculateFontSize(pageHeight: number, ratio: number = 0.02) {
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
    })
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}
