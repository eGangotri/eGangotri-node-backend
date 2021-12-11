import { createPdfAndDeleteGeneratedFiles, pngToPdf } from './utils/PdfUtils';
import { pngFolderName, tiftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './convert';
import { chunk, formatTime } from './utils/Utils';
import { getAllPngs, getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import * as path from 'path';
import { mergeAllPdfsInFolder } from './utils/PdfLibUtils';

export async function tifToPdf(tifRootFolder: string, destPdf: string) {
    if (!fs.existsSync(destPdf)) {
        fs.mkdirSync(destPdf);
    }
    const tifCount = (await getAllTifs(tifRootFolder)).length
    console.log(`--Converting ${tifCount} tifs in Folder \n\t${tifRootFolder}`)
    let tifToPngStats
    try {
        tifToPngStats = await tiftoPngs(tifRootFolder, destPdf)
    }
    catch (e) {
        console.log("----", e);
    }
    console.log("after tifToPngStats")
    if (tifToPngStats.countMatch) {
        const pngRootFolder = pngFolderName(tifRootFolder, destPdf);
        //await loadDividedPngToPDF(pngRootFolder, destPdf)
        await pngsToPdf(pngRootFolder,destPdf)
    }
    else {
        const err = `Error!!!
        \t ${tifRootFolder} 
        \t ${destPdf}
        Tiff Count(${tifToPngStats.tifsCount}) != Png Count(${tifToPngStats.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

export async function loadDividedPngToPDF(pngRootFolder: string, pdfRootFolder: string) {
    const PNG_SUB_FOLDER = "\\pngs\\"
    const PDF_SUB_FOLDER = "\\pdfs\\"
    const allPngs = await getAllPngs(pngRootFolder);
    let counter = 1;
    const chunkedPngs = chunk(allPngs, 50);
    const chunkedPngsCount = chunkedPngs.length;
    for (let _chunkedPngs of chunkedPngs) {
        console.log(`_chunkedPngFolder: ${_chunkedPngs}`);
        const newFolderForChunkedPngs = pngRootFolder + PNG_SUB_FOLDER + `-${counter++}`
        if (!fs.existsSync(newFolderForChunkedPngs)) {
            fs.mkdirSync(newFolderForChunkedPngs);
        }
        for (let _png of _chunkedPngs) {
            const newName = newFolderForChunkedPngs + "\\" + path.parse(_png).name + path.parse(_png).ext;
            console.log(`newName: ${newName}`);
            fs.renameSync(_png, newName);
        }
    }

    let pngToPdfCounter = 0;
    while (pngToPdfCounter < chunkedPngsCount) {
        pngToPdfCounter++;
        console.log(`create pngToPdfCounter ${pngToPdfCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        await pngToPdf(pngRootFolder + PNG_SUB_FOLDER + `-${pngToPdfCounter}`,
         pdfRootFolder + PDF_SUB_FOLDER + `-${pngToPdfCounter}`, pngToPdfCounter===1);
    }

    let pdfMergeCounter = 0;
    while (pdfMergeCounter < chunkedPngsCount) {
        try {
            pdfMergeCounter++;
            console.log(`merge pdfMergeCounter ${pdfMergeCounter}, chunkedPngsCount ${chunkedPngsCount}`);
            await mergeAllPdfsInFolder(pdfRootFolder + PDF_SUB_FOLDER + `-${pdfMergeCounter}`,
                pdfRootFolder + PDF_SUB_FOLDER);
        }
        catch (e) {
            console.log(e);
        }
    }

    await mergeAllPdfsInFolder(pdfRootFolder, pdfRootFolder + "//" + path.parse(pngRootFolder).name + ".pdf");
}

export async function pngsToPdf(folderForPngs: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    await createPdfAndDeleteGeneratedFiles(folderForPngs, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`createPdfAndDeleteGeneratedFiles ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}
