import * as fs from 'fs';
import { getAllPngs } from '../utils/ImgUtils';
import * as path from 'path';
import { GENERATION_REPORT } from '../index';
import { ADD_INTRO_PDF, FOOTER_LINK, FOOTER_TEXT, INTRO_BANNER, INTRO_PAGE_ADJUSTMENT, INTRO_TEXT, PDF_FONT } from './constants';
import { removeExcept, removeFolderWithContents } from './FileUtils';
import { formatTime, garbageCollect, getAllPdfs, heapStats } from './Utils';
import { checkPageCountEqualsImgCountusingPdfLib, mergeAllPdfsInFolder, mergePDFDocuments } from './PdfLibUtils';
const PDFDocument = require('pdfkit');

//https://pdfkit.org/docs/text.html
export async function createPdf(pngSrc: string, pdfDestFolder: string) {
    const _pngs = await getAllPngs(pngSrc);
    let needToAddintroPdf = true;
    heapStats('Starting memory');
    // let counter = 0;
    // for (let png of _pngs) {
    //     const pdf = pdfDestFolder + "\\" + path.parse(png).name + ".pdf";
    //     console.log(`processing 
    //     ${png} to
    //     ${pdf}
    //     `);
    //     await pngToPdf(png, pdf, needToAddintroPdf);
    //     if(counter++ > 3){
    //         break;
    //     }
    //     needToAddintroPdf = false;
    // }

        const firstPdfPageWithIntro = pdfDestFolder + "\\" + path.parse(_pngs[0]).name + ".pdf";
        console.log(`processing 
        ${_pngs[0]} to
        ${firstPdfPageWithIntro}
        `);
        
        await pngToPdf(_pngs[0], firstPdfPageWithIntro, true);
        const promises = [];
        for (let png of _pngs.slice(1)) {
            promises.push(await pngToPdf(png, pdfDestFolder + "\\" + path.parse(png).name + ".pdf", needToAddintroPdf));
        }
        Promise.all(promises).then(async () => {
        console.log("all pdfs converted")
        heapStats('before garbage collection');
        garbageCollect()
        setTimeout( ()=>{
            console.log("sleeping for few minutes")
        }, 10000)
    });

}

async function pngToPdf(pngSrc: string, pdf: string, firstPageNeedingIntro = false) {
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: false });
    const writeStream = fs.createWriteStream(pdf);
    doc.pipe(writeStream); // write to PDF
    let img = doc.openImage(pngSrc);
    if(firstPageNeedingIntro){
        addBanner(doc, img);
    }
    doc.addPage({ size: [img.width, img.height] });
    doc.image(img, 0, 0)
    addFooter(doc)
    // finalize the PDF and end the stream
    doc.end();
    doc.on('end', ()=>{
        console.log(`doc.on png to pdf for ${pdf} done`);
    })
    writeStream.on('finish', function () {
        // do stuff with the PDF file
    console.log(`finish png to pdf for ${pdf} done`);
    });
    console.log(`png to pdf for ${pdf} done`);
}

//https://pdfkit.org/docs/text.html
export async function createPdfWithWriteStream(pngSrc: string, dest: string) {
    const _pngs = await getAllPngs(pngSrc);
    const pdf = dest + "\\" + path.parse(pngSrc).name + ".pdf";
    console.log(`Creating pdf ${pdf} from ${path.parse(pngSrc).name}`);
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: false });
    doc.pipe(fs.createWriteStream(pdf)); // write to PDF

    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        heapStats('Final memory');
        console.timeEnd('Pdf generation time');
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


function addBanner(doc: any, img: any) {
    doc.addPage({ size: [img.width, img.height] });
    const banner = doc.openImage(INTRO_BANNER)
    doc.image(banner, doc.page.margins.left, doc.page.margins.top,
        {
            width: doc.page.width - (doc.page.margins.left + doc.page.margins.right),
            height: doc.page.height * 0.31 - (doc.page.margins.top + doc.page.margins.bottom)
        })
    //doc.moveDown();
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
        GENERATION_REPORT.push(`${pdf}(${pngCount}) created with PageCount same as png count`)
    }
    else {
        GENERATION_REPORT.push(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdf} !!!`)
    }
    return pdfPageCount === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(pngSrc: string, pdfDestFolder: string) {
    await createPdf(pngSrc, pdfDestFolder);
    //removeExcept(pdfDestFolder,[
     //   pdfDestFolder + "\\" +path.parse(pdfDestFolder).name + ".pdf"]);
}

//https://stackoverflow.com/questions/23771085/how-to-pipe-a-stream-using-pdfkit-with-node-js
export async function createPdfX(pngSrc: string, dest: string) {
    const _pngs = await getAllPngs(pngSrc);
    const pdf = dest + "\\" + path.parse(pngSrc).name + ".pdf";
    console.log(`Creating pdf ${pdf} from ${path.parse(pngSrc).name}`);
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: false });
    var buffers:Array<any> = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', function () {
        //https://github.com/foliojs/pdfkit/issues/728
        heapStats('Final memory');
        fs.writeFileSync('some.pdf', Buffer.concat(buffers));
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