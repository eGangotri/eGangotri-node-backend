import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { tiffToPng, getAllTifs, deleteAllPngs } from './imgUtils';
import * as path from 'path';

async function createPdf(pdfName: string, directoryPath: string) {
    const pdfDoc = await PDFDocument.create()
    const _pngs = tiffToPng(getAllTifs(directoryPath),
        directoryPath);
    console.log(`_tiffToPng ${_pngs}`);

    _pngs.forEach(async (_png) => {
        const pngImageBytes = fs.readFileSync(_png);
        const pngImage = await pdfDoc.embedPng(pngImageBytes)
        const pngDims = pngImage.scale(1)

        const page = pdfDoc.addPage()

        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pngDims.width,
            height: pngDims.height,
        })
        const pdfBytes = await pdfDoc.save()
        const pdfName = path.parse(directoryPath).name + ".pdf";     //=> "hello"
        console.log(`pdfName ${pdfName}`)
        fs.writeFileSync(`${directoryPath}\\${pdfName}`, pdfBytes);
    })
}
async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
     createPdf('${directoryPath}\\sample.pdf', directoryPath).then(() =>{
         console.log("after pdf creation. Now delete all generated .pngs")
         //deleteAllPngs(directoryPath);
     })
}

createPdfAndDeleteGeneratedFiles("C:\\tmp\\1")

