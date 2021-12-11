import { createPdf, createPdfAndDeleteGeneratedFiles, pngToPdf } from './utils/PdfUtils';
import { chunk, formatTime } from './utils/Utils';
import { getAllPngs } from './utils/ImgUtils';
import * as fs from 'fs';
import * as path from 'path';
import { checkPageCountEqualsImgCountUsingPdfLib, mergeAllPdfsInFolder } from './utils/PdfLibUtils';
import { removeFolderWithContents } from './utils/FileUtils';
import { CHUNK_SIZE } from '.';

async function directlyFromPngs() {
    const folderForPngs: string = "E:\\ramtek3----WithPdfMErge";
    const destPdf = "C:\\tmp\\pdfMerge"
    await pngToPdf(folderForPngs, destPdf);
}

export async function distributedLoadBasedPnToPdfConverter(pngRootFolder: string, pdfRootFolder: string, tifCount:number) {
    const PNG_SUB_FOLDER = "\\pngs\\"
    const PDF_SUB_FOLDER = "\\pdfs\\"
    const allPngs = await getAllPngs(pngRootFolder);
    let counter = 1;
    const chunkedPngs = chunk(allPngs, CHUNK_SIZE);
    const chunkedPngsCount = chunkedPngs.length;
    console.log(`distributedLoadBasedPnToPdfConverter pngRootFolder ${pngRootFolder} pdfRootFolder ${pdfRootFolder}`);
    if (!fs.existsSync(pngRootFolder + PNG_SUB_FOLDER)) {
        fs.mkdirSync(pngRootFolder + PNG_SUB_FOLDER);
    }
    if (!fs.existsSync(pngRootFolder + PDF_SUB_FOLDER)) {
        fs.mkdirSync(pngRootFolder + PDF_SUB_FOLDER);
    }
    for (let _chunkedPngs of chunkedPngs) {
        //console.log(`_chunkedPngFolder: ${_chunkedPngs.length}`);
        const newFolderForChunkedPngs = pngRootFolder + PNG_SUB_FOLDER + `-${counter++}`
        if (!fs.existsSync(newFolderForChunkedPngs)) {
            fs.mkdirSync(newFolderForChunkedPngs);
        }
        for (let _png of _chunkedPngs) {
            const newName = newFolderForChunkedPngs + "\\" + path.parse(_png).name + path.parse(_png).ext;
            //console.log(`newName: ${newName}`);
            fs.renameSync(_png, newName);
        }
    }

    let pngToPdfCounter = 0;
    while (pngToPdfCounter < chunkedPngsCount) {
        const newFolderForChunkedPdfs = pngRootFolder + PDF_SUB_FOLDER + `-${pngToPdfCounter}`;
        if (!fs.existsSync(newFolderForChunkedPdfs)) {
            fs.mkdirSync(newFolderForChunkedPdfs);
        }pngToPdfCounter++;
        console.log(`create pngToPdfCounter ${pngToPdfCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        await createPdf(pngRootFolder + PNG_SUB_FOLDER + `-${pngToPdfCounter}`,
        pngRootFolder + PDF_SUB_FOLDER + `-${pngToPdfCounter}`, pngToPdfCounter===1);
    }

    let pdfMergeCounter = 0;
    while (pdfMergeCounter < chunkedPngsCount) {
        try {
            pdfMergeCounter++;
            console.log(`merge pdfMergeCounter ${pdfMergeCounter}, chunkedPngsCount ${chunkedPngsCount}`);
            const pdfPath = 
            pngRootFolder + PDF_SUB_FOLDER + `-${pdfMergeCounter}.pdf`
            await mergeAllPdfsInFolder(pngRootFolder + PDF_SUB_FOLDER + `-${pdfMergeCounter}`,pdfPath);
            await checkPageCountEqualsImgCountUsingPdfLib(pdfPath,tifCount);
        }
        catch (e) {
            console.log(e);
        }
    }

    await mergeAllPdfsInFolder(pngRootFolder + PDF_SUB_FOLDER, pdfRootFolder + "//" + path.parse(pngRootFolder).name + ".pdf");
    //removeFolderWithContents(pngRootFolder);
}

export async function pngsToPdf(folderForPngs: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    await createPdfAndDeleteGeneratedFiles(folderForPngs, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`createPdfAndDeleteGeneratedFiles ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}
