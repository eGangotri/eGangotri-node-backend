import { createPdf, createPdfFromDotSum, createRedundantPdf } from './utils/PdfUtils';
import {
    chunk, formatTime,
    getAllDotSumFiles, getAllPdfsInFolders,
    getAllPngsInFolders, getDirectories,
    getDirectoriesWithFullPath,
    mkDirIfDoesntExists
} from './utils/Utils';
import { getAllPngs } from './utils/ImgUtils';
import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { CHUNK_SIZE, HANDLE_CHECKSUM, INTRO_PAGE_ADJUSTMENT, REDUNDANT_FOLDER } from '.';
import { PDF_SUB_FOLDER, PNG_SUB_FOLDER } from './utils/constants';
import { appendAlphaCodeForNum } from './utils/PngUtils';


/**
 * Pngs are created in pngPdfDumpFolder
 * chunker shifts in several small folders inside pngPdfDumpFolder/pngs folder
 * @param pngPdfDumpFolder 
 * @param pdfRootFolder 
 * @returns 
 */
export async function chunkPngs(pngPdfDumpFolder: string) {
    let RENAME_FAILURE_MAP = new Map()
    const allPngs = await getAllPngs(pngPdfDumpFolder);
    const chunkedPngs = chunk(allPngs, CHUNK_SIZE);
    console.log(`pngs in ${pngPdfDumpFolder} dumped to ${chunkedPngs.length} folders`);

    await mkDirIfDoesntExists(pngPdfDumpFolder + PNG_SUB_FOLDER);

    const promiseArrayFirst = chunkedPngs.map(async (_chunkedPngs, index) => {
        //console.log(`_chunkedPngFolder: ${_chunkedPngs} ${index}`);
        const newFolderForChunkedPngs = pngPdfDumpFolder + PNG_SUB_FOLDER + `-${appendAlphaCodeForNum(index + 1)}`
        return mkDirIfDoesntExists(newFolderForChunkedPngs);
    });
    await Promise.all(promiseArrayFirst)

    const promiseArraySecond: Array<Promise<any>> = []
    chunkedPngs.map((_chunkedPngs, index: number) => {
        const newFolderForChunkedPngs = pngPdfDumpFolder + PNG_SUB_FOLDER + `-${appendAlphaCodeForNum(index + 1)}`
        for (let _png of _chunkedPngs) {
            const newName = newFolderForChunkedPngs + "\\" + path.parse(_png).name + path.parse(_png).ext;
            //console.log(`newName: ${newName}`);
            promiseArraySecond.push(fsPromise.rename(_png, newName))
        }
    })
    await Promise.all(promiseArraySecond)
    //console.log(`async png chunking over.  Rename Failure Count: ${RENAME_FAILURE_MAP.size}`);
    for (const [_png, newName] of RENAME_FAILURE_MAP.entries()) {
        await fsPromise.rename(_png, newName);
    }
}


export async function distributedLoadBasedPngToPdfConverter(pngPdfDumpFolder: string,
    dotSumFiles: Array<string> = []) {
    //console.log(`distributedLoadBasedPngToPdfConverter:pngPdfDumpFolder  ${pngPdfDumpFolder}`)
    if (HANDLE_CHECKSUM) {
        await handleDotSumFile(pngPdfDumpFolder, dotSumFiles)
    }
    const origPngCount = (await getAllPngs(pngPdfDumpFolder)).length

    let START_TIME = Number(Date.now())
    await chunkPngs(pngPdfDumpFolder)
    let END_TIME = Number(Date.now())
    console.log(`Time Taken for chunkPngs ${formatTime(END_TIME - START_TIME)}`);
    const pngCountCheck = await testChunkPngsFileCountIsCorrect(pngPdfDumpFolder, origPngCount);
    if (pngCountCheck) {
        START_TIME = Number(Date.now())
        await chunkedPngsToChunkedPdfs(pngPdfDumpFolder)
        END_TIME = Number(Date.now())
        console.log(`Time Taken for chunkedPngsToChunkedPdfs ${formatTime(END_TIME - START_TIME)}`);
        const pdfCountCheck = await testChunkPdfsFileCountIsCorrect(pngPdfDumpFolder, origPngCount);
        if (!pdfCountCheck) {
            console.error("***** Fatal. ChunkedPngs has a Count Mismatch. Cant proceed")
        }
    }
    else {
        console.error("***** Fatal. ChunkedPngs has a Count Mismatch. Cant proceed")
    }

}
async function testChunkPngsFileCountIsCorrect(pngPdfDumpFolder: string, origPngCount: number) {
    const _pngs = pngPdfDumpFolder + PNG_SUB_FOLDER
    const _folders = (await getDirectoriesWithFullPath(_pngs)).filter(
        (dir: any) => !dir.match(/ignore/)
    );
    const pngsInFolders = await getAllPngsInFolders(_folders);
    const countCheck = pngsInFolders.length == origPngCount
    //console.log(`:testChunkPngsFileCountIsCorrect: (${pngsInFolders.length} == ${origPngCount}) == ${countCheck} `)
    return countCheck
}
async function testChunkPdfsFileCountIsCorrect(pngPdfDumpFolder: string, origPngCount: number) {
    const _pdfs = pngPdfDumpFolder + PDF_SUB_FOLDER
    const _folders = (await getDirectoriesWithFullPath(_pdfs)).filter(
        (dir: any) => !dir.match(/ignore/)
    );
    const pdfsInFolders = await getAllPdfsInFolders(_folders);
    const countCheck = pdfsInFolders.length == origPngCount + INTRO_PAGE_ADJUSTMENT
    //console.log(`:testChunkPdfsFileCountIsCorrect: (${pdfsInFolders.length} == ${origPngCount + INTRO_PAGE_ADJUSTMENT}) == ${countCheck} `)
    return countCheck
}

export async function handleDotSumFile(pngPdfDumpFolder: string, dotSumFiles: Array<string>) {
    if (dotSumFiles?.length > 0) {
        const newDotSumFile = pngPdfDumpFolder + "//" + path.parse(dotSumFiles[0]).name + path.parse(dotSumFiles[0]).ext
        const dotSumFile = await fsPromise.readFile(dotSumFiles[0]);
        await fsPromise.writeFile(newDotSumFile, dotSumFile);
    }
}

export async function chunkedPngsToChunkedPdfs(pngPdfDumpFolder: string) {
    const _pngs = pngPdfDumpFolder + PNG_SUB_FOLDER
    const _pdfs = pngPdfDumpFolder + PDF_SUB_FOLDER

    await mkDirIfDoesntExists(_pdfs);

    const chunkedPngsCount = (await getDirectories(_pngs)).length
    let pngToPdfCounter = 0;
    let alphaAppendedArray = [];
    while (pngToPdfCounter < chunkedPngsCount) {
        pngToPdfCounter++;
        const alphaAppended = appendAlphaCodeForNum(pngToPdfCounter)
        const newFolderForChunkedPdfs = `${_pdfs}-${alphaAppended}`;
        await mkDirIfDoesntExists(newFolderForChunkedPdfs);
        alphaAppendedArray.push(alphaAppended)
    }

    const promises = alphaAppendedArray.map((alphaAppended, index) => {
        return createPdf(`${_pngs}-${alphaAppended}`, `${_pdfs}-${alphaAppended}`, index === 0)
    });

    await Promise.all(promises);

    if (HANDLE_CHECKSUM) {
        const dotSumFile = await getAllDotSumFiles(pngPdfDumpFolder)
        if (dotSumFile?.length > 0) {
            const lastPdfDumpFolder = `${_pdfs}-${appendAlphaCodeForNum(pngToPdfCounter)}`
            const firstDotSumFile = await fsPromise.readFile(dotSumFile[0]);
            await createPdfFromDotSum(firstDotSumFile.toString(), lastPdfDumpFolder);
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
