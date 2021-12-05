import * as fs from 'fs';
import { tiffToPng, getAllTifs, deleteAllPngs, getAllPngs } from './imgUtils';
import * as path from 'path';
import { createPngs } from './tifToPng';

const PDFDocument = require('pdfkit');


async function createPdf(directoryPath: string) {
    const _pngs = await getAllPngs(directoryPath);
    const pdfName = directoryPath + "\\" + path.parse(directoryPath).name + "-1.pdf";
    console.log(`pdfName ${pdfName}`)
    const doc = new PDFDocument({autoFirstPage: false});


    doc.pipe(fs.createWriteStream(pdfName)); // write to PDF

    let img = doc.openImage(_pngs[0]);
    doc.addPage({size: [img.width, img.height]});
    doc.image(img, 0, 0);

    img = doc.openImage(_pngs[1]);
    doc.addPage({size: [img.width, img.height]});
    doc.image(img, 0, 0);
    // finalize the PDF and end the stream
    doc.end();
    console.log("PDF created")
   // await imagesToPdf(_pngs, pdfName)
}
async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
    await createPdf(directoryPath);
    console.log("after pdf creation. Now delete all generated .pngs")
    deleteAllPngs(directoryPath);
}



(async () => {
    const src = "C:\\tmp\\1"
    await deleteAllPngs(src);
    await createPngs(src)
    console.log(`createPngs ends`)
    await createPdfAndDeleteGeneratedFiles(src);
})()

