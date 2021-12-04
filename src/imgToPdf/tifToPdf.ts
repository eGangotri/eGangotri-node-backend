import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { tiffToPng, getAllTifs, deleteAllPngs } from './imgUtils';

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
        fs.writeFileSync(`${directoryPath}\\sample.pdf`, pdfBytes);
    })
}
async function createPdfAndDeleteGeneratedFiles(directoryPath: string) {
    await createPdf('${directoryPath}\\sample.pdf', directoryPath)
    console.log("after pdf creation. Now delete all generated .pngs")
    //deleteAllPngs(directoryPath);
}

createPdfAndDeleteGeneratedFiles("C:\\tmp\\sampleTifs")

