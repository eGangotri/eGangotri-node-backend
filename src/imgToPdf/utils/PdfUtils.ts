import * as fs from 'fs';
import { deleteAllPngs, getAllPngs, getAllTifs } from '../utils/ImgUtils';
import * as path from 'path';

const PDFDocument = require('pdfkit');

const FOOTER_TEXT = 'CC-0. Kavikulguru Kalidas Sanskrit University Ramtek Collection';
//https://pdfkit.org/docs/text.html
export async function createPdf(directoryPath: string) {
    const _pngs = await getAllPngs(directoryPath);
    const pdfName = directoryPath + "\\" + path.parse(directoryPath).name + ".pdf";
    console.log(`pdfName ${pdfName}`)
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    doc.pipe(fs.createWriteStream(pdfName)); // write to PDF

    for (let png of _pngs) {
        let img = doc.openImage(png);
        doc.addPage({ size: [img.width, img.height] });
        doc.image(img, 0, 0)
        addFooter(doc)
    }

    // finalize the PDF and end the stream
    doc.end();
    console.log("PDF created")
    //checkPageCount(doc, _pngs.length)

}

function calculateFontSize(pageHeight:number){
    const fontSize =  pageHeight*0.02 > 12 ? pageHeight*0.02: 12;
    console.log(`fontSize: ${fontSize}`);
    return fontSize;
}

function addFooter(doc:any){
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const yCoordinate = doc.page.height * 0.95
    console.log(`doc.page.height - (oldBottomMargin / 2)
     ${doc.page.height} 
     ${(oldBottomMargin)}
     ${yCoordinate}`)
    doc.font('Times-Roman').fontSize(calculateFontSize(doc.page.height))
        .fillColor('black')
        .text(FOOTER_TEXT, 0, yCoordinate, {
            link: 'https://kksu.org/',
            align: 'center'
        });

    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

function addFooter2(pdfName:string) {
    const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
    doc.pipe(fs.createWriteStream(pdfName)); 
    //Global Edits to All Pages (Header/Footer, etc)
    let pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        try{
            console.log(`adding footer to page ${i}`)
            doc.switchToPage(i);
        }
        catch(e){
            console.log(e);
            continue;
        }

        //Footer: Add page number
        let oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
        doc.font('Times-Roman').fontSize(75)
            .fillColor('black')
            .text(FOOTER_TEXT, 0, doc.page.height - (oldBottomMargin / 2), {
                link: 'https://kksu.org/',
                align: 'center'
            });

        doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
    }
    doc.end();
}

function checkPageCount(doc: any, pngCount) {
    const range = doc.bufferedPageRange();
    console.log(`range.start + range.count ${JSON.stringify(range)} `)
    if (range.start === pngCount) {
        console.log(`Success PNG COunt [${pngCount}] == PDF Page Count[${range.start}]`);
    }
    else {
        console.log(`*****Eror PNG COunt [${pngCount}] !!== PDF Page Count[${range.start}]`);

    }
    return range.start === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
    await createPdf(directoryPath);
    console.log("after pdf creation. Now delete all generated .pngs")
    deleteAllPngs(directoryPath);
}
