import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { tiffToPng, getAllTifs, deleteAllPngs, getAllPngs } from './imgUtils';
import * as path from 'path';
import { createPngs } from './tifToPng';

async function createPdf2(directoryPath: string) {
    const _pngs = await getAllPngs(directoryPath);
    const pdfName = path.parse(directoryPath).name + ".pdf";
    console.log(`pdfName ${pdfName}`)
   // await imagesToPdf(_pngs, pdfName)
}
async function createPdf(directoryPath: string) {
    const _pngs = await getAllPngs(directoryPath);

    console.log(`_tiffToPng ${_pngs}`);
    const pdfDoc = await PDFDocument.create()

    for (let _png of _pngs) {
        const pngImageBytes = fs.readFileSync(_png);
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        const pngDims = pngImage.scale(1)

        const page = pdfDoc.addPage()
        page.drawImage(pngImage)
        const pdfBytes = await pdfDoc.save()
        const pdfName = path.parse(directoryPath).name + ".pdf";
        console.log(`pdfName ${pdfName}`)
        fs.writeFileSync(`${directoryPath}\\${pdfName}`, pdfBytes);
    }
}
async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
    await createPdf2(directoryPath);
    console.log("after pdf creation. Now delete all generated .pngs")
    //deleteAllPngs(directoryPath);
}



(async () => {
    const src = "C:\\tmp\\1"
    await deleteAllPngs(src);
    await createPngs(src)
    console.log(`createPngs ends`)
    await createPdfAndDeleteGeneratedFiles(src);
})()

