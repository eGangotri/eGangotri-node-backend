import * as fs from 'fs';
import { getAllPngs } from '../utils/ImgUtils';
import * as path from 'path';
import { addReport } from '../index';
import { PDF_EXT } from './constants';
import { FOOTER_LINK, FOOTER_TEXT, INTRO_BANNER, INTRO_TEXT, PDF_FONT } from './PdfDecoratorUtils';
import { garbageCollect, heapStats } from './Utils';
import { ADD_INTRO_PDF, INTRO_PAGE_ADJUSTMENT } from '..';
const PDFDocument = require('pdfkit');

const SUM_FOLDER_NAME = "SUM.pdf"
let DEFAULT_PDF_WIDTH = 300
let DEFAULT_PDF_HEIGHT = 500
//https://pdfkit.org/docs/text.html
export async function createPdf(pngSrc: string, pdfDestFolder: string, firstPageNeedingIntro = false) {
    if (!fs.existsSync(pdfDestFolder)) {
        fs.mkdirSync(pdfDestFolder);
    }
    const _pngs = await getAllPngs(pngSrc);
    heapStats('Starting memory');
    if (_pngs?.length) {
        let counter = 0;
        await pngToPdf(_pngs[0], pdfDestFolder + "\\" + path.parse(_pngs[0]).name + PDF_EXT, firstPageNeedingIntro);

        for (let png of _pngs.slice(1)) {
            const pdf = pdfDestFolder + "\\" + path.parse(png).name + PDF_EXT;
            // console.log(`processing 
            // ${png} to
            // ${pdf}
            // `);
            await pngToPdf(png, pdf);
            counter++
            if (counter % 75 === 0 || counter === _pngs.length) {
                heapStats('before garbage collection');
                garbageCollect()
            }
        }
    }
}
export async function createRedundantPdf(pdfPath: string) {
    if (!fs.existsSync(pdfPath)) {
        fs.mkdirSync(pdfPath)
    }
    const pdfPathWithName = pdfPath + "\\" + `redundant${Number(Date.now())}.pdf`
    const doc = new PDFDocument({ autoFirstPage: false });
    var buffers: Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        //heapStats('Final memory on doc end');
        fs.writeFileSync(pdfPathWithName, Buffer.concat(buffers));
    });
    doc.on("error", (err: any) => console.log("error" + err));
    doc.addPage();
    doc.text("redundant");
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
}

export async function createPdfFromDotSum(dotSumText: String, pdfDumpFolder: string) {
    const doc = new PDFDocument({ autoFirstPage: false });
    var buffers: Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        heapStats('Final memory on doc end');
        fs.writeFileSync(`${pdfDumpFolder}//${SUM_FOLDER_NAME}`, Buffer.concat(buffers));
    });
    doc.on("error", (err: any) => console.log("error" + err));
    
    doc.addPage({ size: [DEFAULT_PDF_WIDTH, DEFAULT_PDF_HEIGHT] });

    doc.font(PDF_FONT).fontSize(calculateFontSize(DEFAULT_PDF_HEIGHT))
        .fillColor('black')
        .text(dotSumText, doc.page.margins.left, doc.page.margins.top, {
            align: 'left'
        });
    console.log(`after docSumText`);

    //addFooter(doc)
    doc.save()
    // finalize the PDF and end the stream
    doc.end();
}


export async function pngToPdf(pngSrc: string, pdf: string, firstPageNeedingIntro = false) {
    const doc = new PDFDocument({ autoFirstPage: false });
    var buffers: Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        heapStats('Final memory on doc end');
        fs.writeFileSync(pdf, Buffer.concat(buffers));
    });
    doc.on("error", (err: any) => console.log("error" + err));
    //console.log(`pngToPdf ${pngSrc} pdf ${pdf} firstPageNeedingIntro ${firstPageNeedingIntro}`)
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
        });
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
        });
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

function checkPageCountEqualsImgCount(doc: any, pdf: string, pngCount: number) {
    const range = doc.bufferedPageRange();
    const pdfPageCount = range.start - INTRO_PAGE_ADJUSTMENT;
    if (pdfPageCount === pngCount) {
        addReport(`${pdf}(${pngCount}) created with PageCount same as png count`)
    }
    else {
        addReport(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdf} !!!`)
    }
    return pdfPageCount === pngCount
}


//https://stackoverflow.com/questions/23771085/how-to-pipe-a-stream-using-pdfkit-with-node-js
export async function createPdfWithBuffer(pngSrc: string, dest: string) {
    const _pngs = await getAllPngs(pngSrc);
    const pdf = dest + "\\" + path.parse(pngSrc).name + PDF_EXT;
    //console.log(`Creating pdf ${pdf} from ${path.parse(pngSrc).name}`);
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: false });
    var buffers: Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        heapStats('Final memory');
        fs.writeFileSync(pdf, Buffer.concat(buffers));
    });
    let garbageCollectCounter = 0;
    let introPDFAdded = false;
    heapStats('Starting memory');

    for (let png of _pngs) {
        let img = doc.openImage(png);
        if (!introPDFAdded && ADD_INTRO_PDF) {
            introPDFAdded = true;
            addBanner(doc, img);
        }
        doc.addPage({ size: [img.width, img.height] });
        doc.image(img, 0, 0)
        addFooter(doc)
        garbageCollectCounter++
        if (garbageCollectCounter % 75 === 0 || garbageCollectCounter === _pngs.length) {
            heapStats('before garbage collection');
            garbageCollect()
        }
    }

    // finalize the PDF and end the stream
    doc.end();
    console.log(`Created pdf from ${_pngs.length} Image Files: \n\t${pdf}`)
    checkPageCountEqualsImgCount(doc, pdf, _pngs.length);
}