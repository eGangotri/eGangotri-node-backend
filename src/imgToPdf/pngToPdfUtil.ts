import { createPdf, createPdfFromDotSum, createRedundantPdf } from './utils/PdfUtils';
import { chunk, formatTime, getAllDotSumFiles, getDirectories } from './utils/Utils';
import { getAllPngs } from './utils/ImgUtils';
import * as fs from 'fs';
import * as path from 'path';
import { CHUNK_SIZE, HANDLE_CHECKSUM, REDUNDANT_FOLDER } from '.';
import { PDF_SUB_FOLDER, PNG_SUB_FOLDER } from './utils/constants';
import { genPngFolderNameAndCreateIfNotExists } from './utils/PngUtils';


/**
 * Pngs are created in pngPdfDumpFolder
 * chunker shifts in several small folders inside pngPdfDumpFolder/pngs folder
 * @param pngPdfDumpFolder 
 * @param pdfRootFolder 
 * @returns 
 */
export async function chunkPngs(pngPdfDumpFolder: string){
    const allPngs = await getAllPngs(pngPdfDumpFolder);
    const chunkedPngs = chunk(allPngs, CHUNK_SIZE);
    console.log(`allPngs ${allPngs}`);
    console.log(`chunkPngs to pngPdfDumpFolder ${pngPdfDumpFolder} chunkedPngs 
    ${chunkedPngs}`);


    if (!fs.existsSync(pngPdfDumpFolder + PNG_SUB_FOLDER)) {
        fs.mkdirSync(pngPdfDumpFolder + PNG_SUB_FOLDER);
    }
    let counter = 1;
    for (let _chunkedPngs of chunkedPngs) {
        console.log(`_chunkedPngFolder: ${_chunkedPngs.length}`);
        const newFolderForChunkedPngs = pngPdfDumpFolder + PNG_SUB_FOLDER + `-${counter++}`
        if (!fs.existsSync(newFolderForChunkedPngs)) {
            fs.mkdirSync(newFolderForChunkedPngs);
        }
        for (let _png of _chunkedPngs) {
            const newName = newFolderForChunkedPngs + "\\" + path.parse(_png).name + path.parse(_png).ext;
            console.log(`newName: ${newName}`);
            fs.renameSync(_png, newName);
        }
    }

}

export async function distributedLoadBasedPngToPdfConverter(pngPdfDumpFolder: string,
     dotSumFiles:Array<string> = []) {
    console.log(`pngPdfDumpFolder  ${pngPdfDumpFolder}`)
    if(HANDLE_CHECKSUM){
        await handleDotSumFile(pngPdfDumpFolder,dotSumFiles)
    }
    await chunkPngs(pngPdfDumpFolder)
    await chunkedPngsToChunkedPdfs(pngPdfDumpFolder)
}

export async function handleDotSumFile( pngPdfDumpFolder: string, dotSumFiles:Array<string>) {
    if(dotSumFiles?.length > 0){
        const newDotSumFile = pngPdfDumpFolder + "//" + path.parse(dotSumFiles[0]).name + path.parse(dotSumFiles[0]).ext
        fs.writeFileSync(newDotSumFile, fs.readFileSync(dotSumFiles[0]));
    }
}

export async function chunkedPngsToChunkedPdfs(pngPdfDumpFolder: string){
    const _pngs = pngPdfDumpFolder+ PNG_SUB_FOLDER 
    const _pdfs = pngPdfDumpFolder+ PDF_SUB_FOLDER 
    
    if (!fs.existsSync(_pdfs)) {
        fs.mkdirSync(_pdfs);
    }
    const chunkedPngsCount = (await getDirectories(_pngs)).length
    let pngToPdfCounter = 0;
    while (pngToPdfCounter < chunkedPngsCount) {
        pngToPdfCounter++;
        const newFolderForChunkedPdfs = `${_pdfs}-${pngToPdfCounter}`;
        if (!fs.existsSync(newFolderForChunkedPdfs)) {
            fs.mkdirSync(newFolderForChunkedPdfs);
        }
        //console.log(`create pngToPdfCounter ${pngToPdfCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        await createPdf(`${_pngs}-${pngToPdfCounter}`,
        `${_pdfs}-${pngToPdfCounter}`, pngToPdfCounter===1);
    }
    if(HANDLE_CHECKSUM){
        const dotSumFile =  await getAllDotSumFiles(pngPdfDumpFolder)
        if(dotSumFile?.length>0){
            const lastPdfDumpFolder = `${_pdfs}-${pngToPdfCounter}`
            await createPdfFromDotSum(fs.readFileSync(dotSumFile[0]).toString(),lastPdfDumpFolder);
        }
    }

    //hack to force a flush
    await createRedundantPdf(REDUNDANT_FOLDER);
}

export async function pngsToPdf(folderForPngs: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    await createPdf(folderForPngs, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`pngsToPdf ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}
