import * as fs from 'fs';
import {deleteAllPngs, getAllPngs, getAllTifs } from '../utils/ImgUtils';
import * as path from 'path';

const PDFDocument = require('pdfkit');
//https://pdfkit.org/docs/text.html
export async function createPdf(directoryPath: string) {
    const _pngs = await getAllPngs(directoryPath);
    const pdfName = directoryPath + "\\" + path.parse(directoryPath).name + ".pdf";
    console.log(`pdfName ${pdfName}`)
    const doc = new PDFDocument({autoFirstPage: false});


    doc.pipe(fs.createWriteStream(pdfName)); // write to PDF
    for(let png of _pngs){
        let img = doc.openImage(png);
        console.log((`img.width ${img.width}`))
        console.log((`img.height ${img.height}`))
        console.log((`doc.x ${doc.x}`))
        console.log((`doc.y ${doc.y}`))
        doc.addPage({size: [img.width, img.height]});
        doc.image(img, 0, 0)
        
        console.log((`*doc.x ${doc.x}`))
        console.log((`*doc.y ${doc.y}`))
        doc.fontSize(75)
        .fillColor('black')
        .text('CC-0. Kavikulguru Kalidas Sanskrit University Ramtek Collection', 0,doc.y+10, {
            link: 'https://kksu.org/',
            align: 'center'
        });
        
        console.log((`**doc.x ${doc.x}`))
        console.log((`**doc.y ${doc.y}`))
    }

    // finalize the PDF and end the stream
    doc.end();
    console.log("PDF created")
    checkPageCount(doc,_pngs.length)

}

function checkPageCount(doc:any,pngCount){
    const range = doc.bufferedPageRange();
    console.log(`range.start + range.count ${JSON.stringify(range)} `)
    if(range.start === pngCount){
        console.log(`Success PNG COunt [${pngCount}] == PDF Page Count[${range.start}]`);
    }
    else{
        console.log(`*****Eror PNG COunt [${pngCount}] !!== PDF Page Count[${range.start}]`);

    }
    return range.start === pngCount
}

export async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
    await createPdf(directoryPath);
    console.log("after pdf creation. Now delete all generated .pngs")
    deleteAllPngs(directoryPath);
}
