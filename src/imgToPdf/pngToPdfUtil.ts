import { createPdf, createPdfFromDotSum, createRedundantPdf } from './utils/PdfUtils';
import { chunk, formatTime, getAllDotSumFiles, getDirectories, mkDirIfDoesntExists } from './utils/Utils';
import { getAllPngs } from './utils/ImgUtils';
import * as fs from 'fs';
import * as path from 'path';
import { CHUNK_SIZE, HANDLE_CHECKSUM, REDUNDANT_FOLDER } from '.';
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
    const allPngs = await getAllPngs(pngPdfDumpFolder);
    const chunkedPngs = chunk(allPngs, CHUNK_SIZE);
    console.log(`allPngs ${allPngs}`);
    console.log(`chunkPngs to pngPdfDumpFolder ${pngPdfDumpFolder} chunkedPngs 
    ${chunkedPngs.length}`);

    await mkDirIfDoesntExists(pngPdfDumpFolder + PNG_SUB_FOLDER);

    return Promise.all(chunkedPngs.map((_chunkedPngs, index) => {
        console.log(`_chunkedPngFolder: ${_chunkedPngs.length} ${index}`);

        const newFolderForChunkedPngs = pngPdfDumpFolder + PNG_SUB_FOLDER + `-${appendAlphaCodeForNum(index + 1)}`
        fs.mkdir(newFolderForChunkedPngs, (err) => {
            if (err) throw err;
            for (let _png of _chunkedPngs) {
                const newName = newFolderForChunkedPngs + "\\" + path.parse(_png).name + path.parse(_png).ext;
                console.log(`newName: ${newName}`);
                fs.rename(_png, newName, function (err) {
                    if (err) console.log('ERROR in renaming: ' + err);
                });
            }
        });
    })).then(() => {
        console.log(`async chunking over`);
        return {}
    });
}

export async function distributedLoadBasedPngToPdfConverter(pngPdfDumpFolder: string,
    dotSumFiles: Array<string> = []) {
    console.log(`pngPdfDumpFolder  ${pngPdfDumpFolder}`)
    if (HANDLE_CHECKSUM) {
        await handleDotSumFile(pngPdfDumpFolder, dotSumFiles)
    }
    let START_TIME = Number(Date.now())
    await chunkPngs(pngPdfDumpFolder)
    let END_TIME = Number(Date.now())
    console.log(`Time Taken for chunkPngs ${formatTime(END_TIME - START_TIME)}`);

    START_TIME = Number(Date.now())
    await chunkedPngsToChunkedPdfs(pngPdfDumpFolder)
    END_TIME = Number(Date.now())
    console.log(`Time Taken for chunkedPngsToChunkedPdfs ${formatTime(END_TIME - START_TIME)}`);
}

export async function handleDotSumFile(pngPdfDumpFolder: string, dotSumFiles: Array<string>) {
    if (dotSumFiles?.length > 0) {
        const newDotSumFile = pngPdfDumpFolder + "//" + path.parse(dotSumFiles[0]).name + path.parse(dotSumFiles[0]).ext
        await fs.promises.writeFile(newDotSumFile, fs.readFileSync(dotSumFiles[0]));
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
        //console.log(`create pngToPdfCounter ${pngToPdfCounter}, chunkedPngsCount ${chunkedPngsCount}`);
        // await createPdf(`${_pngs}-${alphaAppended}`,
        // `${newFolderForChunkedPdfs}`, pngToPdfCounter===1);
    }

    return Promise.all(alphaAppendedArray.map((alphaAppended, index) => {
        createPdf(`${_pngs}-${alphaAppended}`, `${_pdfs}-${alphaAppended}`, index === 0)
    }
    )).then(async () => {
        if (HANDLE_CHECKSUM) {
            const dotSumFile = await getAllDotSumFiles(pngPdfDumpFolder)
            if (dotSumFile?.length > 0) {
                const lastPdfDumpFolder = `${_pdfs}-${appendAlphaCodeForNum(pngToPdfCounter)}`
                await createPdfFromDotSum(fs.readFileSync(dotSumFile[0]).toString(), lastPdfDumpFolder);
            }
        }

        //hack to force a flush
        await createRedundantPdf(REDUNDANT_FOLDER);
    });

}

export async function pngsToPdf(folderForPngs: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    await createPdf(folderForPngs, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`pngsToPdf ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}
