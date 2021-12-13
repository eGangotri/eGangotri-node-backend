import { createPdf, createPdfAndDeleteGeneratedFiles, createRedundantPdf, pngToPdf } from './utils/PdfUtils';
import { chunk, formatTime } from './utils/Utils';
import { getAllPngs } from './utils/ImgUtils';
import * as fs from 'fs';
import * as path from 'path';
import { addReport, CHUNK_SIZE, REDUNDANT_FOLDER } from '.';
import { PDF_EXT, PDF_SUB_FOLDER, PNG_SUB_FOLDER } from './utils/constants';

async function directlyFromPngs(folderForPngs:string, pdfNameWithPath:string) {
    await pngToPdf(folderForPngs, pdfNameWithPath);
}

export async function distributedLoadBasedPnToPdfConverter(pngRootFolder: string, pdfRootFolder: string, tifCount:number) {
    const allPngs = await getAllPngs(pngRootFolder);
    const chunkedPngs = chunk(allPngs, CHUNK_SIZE);
    const chunkedPngsCount = chunkedPngs.length;
    console.log(`distributedLoadBasedPnToPdfConverter 
    pngRootFolder ${pngRootFolder} 
    pdfRootFolder ${pdfRootFolder}`);
    if (!fs.existsSync(pngRootFolder + PNG_SUB_FOLDER)) {
        fs.mkdirSync(pngRootFolder + PNG_SUB_FOLDER);
    }
    if (!fs.existsSync(pngRootFolder + PDF_SUB_FOLDER)) {
        fs.mkdirSync(pngRootFolder + PDF_SUB_FOLDER);
    }
    let counter = 1;
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
        pngToPdfCounter++;
        const newFolderForChunkedPdfs = pngRootFolder + PDF_SUB_FOLDER + `-${pngToPdfCounter}`;
        if (!fs.existsSync(newFolderForChunkedPdfs)) {
            fs.mkdirSync(newFolderForChunkedPdfs);
        }
        console.log(`create pngToPdfCounter ${pngToPdfCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        await createPdf(pngRootFolder + PNG_SUB_FOLDER + `-${pngToPdfCounter}`,
        pngRootFolder + PDF_SUB_FOLDER + `-${pngToPdfCounter}`, pngToPdfCounter===1);
    }
    //hack to force a flush
    await createRedundantPdf(REDUNDANT_FOLDER);


    let pdfMergeCounter = 0;
    let listOfAllPDFFoldersCreated = []
    while (pdfMergeCounter < chunkedPngsCount) {
        pdfMergeCounter++;
        //console.log(`merge pdfMergeCounter ${pdfMergeCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        const pdfPath = pngRootFolder + PDF_SUB_FOLDER + `-${pdfMergeCounter}`;
        const pdfNameWithPath = pdfPath + `.pdf`
        listOfAllPDFFoldersCreated.push(pdfPath)
        try {
           // await mergeAllPdfsInFolder(pngRootFolder + PDF_SUB_FOLDER + `-${pdfMergeCounter}`,pdfNameWithPath);
        }
        catch (e) {
            console.log(`error while generating ${pdfNameWithPath}` + e);
        }
    }

    const finalPdfPath = pdfRootFolder + "//" + path.parse(pngRootFolder).name + PDF_EXT;
    try {
         //console.log(`Merging Final PDF: ${finalPdfPath}`);
        //because there is issue combining large pdfs we are limiting to this work-around
        //await mergeAllPdfsInFolder(pngRootFolder + PDF_SUB_FOLDER,finalPdfPath);
        //await mergePdfsInList([listOfAllPDFFoldersCreated],finalPdfPath);
    }
    catch (e:any) {
        console.log(e);
        addReport(`${finalPdfPath} Generation Error ${e}`);
    }
    //await checkPageCountEqualsImgCount(finalPdfPath,tifCount);
    //removeFolderWithContents(pngRootFolder);
}

export async function pngsToPdf(folderForPngs: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    await createPdfAndDeleteGeneratedFiles(folderForPngs, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`createPdfAndDeleteGeneratedFiles ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}
