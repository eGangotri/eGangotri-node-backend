import {
    folderCountEqualsPDFCount, formatTime,
    garbageCollect,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import { checkPageCountEqualsImgCountusingPdfLib, mergeAllPdfsInFolder } from './utils/PdfLibUtils';
"use strict";
import * as path from 'path';
import { getAllTifs } from './utils/ImgUtils';
import { createUnparsedSourceFile } from 'typescript';
import { pngToPdf } from './utils/PdfUtils';

export let GENERATION_REPORT: Array<string> = [];

async function execDynamic() {
    const index = 2;
    const FOLDERS = await getUploadableFolders("D:\\NMM\\August-2019", "E:\\");
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1} 
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const dest = FOLDERS[index].dest;
    const tifFoldersForTransformation = await getDirectoriesWithFullPath(src);
    console.log(`${tifFoldersForTransformation}`)
    await exec(tifFoldersForTransformation, dest)
}

async function exec(tifFoldersForTransformation: Array<string>, pdfDest: string) {
    if (!fs.existsSync(pdfDest)) {
        fs.mkdirSync(pdfDest);
    }
    const tifFoldersForTransformationCount = tifFoldersForTransformation.length;
    console.log(`TifToPDF started for ${tifFoldersForTransformationCount} Folder(s)\n\t${tifFoldersForTransformation.join("\n\t")}`)
    const START_TIME = Number(Date.now())
    GENERATION_REPORT.push(`TifToPDF started for ${tifFoldersForTransformationCount} folder(s) at ${new Date(START_TIME)}`)
    for (let mainFolder of tifFoldersForTransformation) {
        await tifToPdf(mainFolder, pdfDest);
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(tifFoldersForTransformation.length, pdfDest));
    GENERATION_REPORT.push(`TifToPDF ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
}

async function directlyFromPngs() {
    const folderForPngs: string = "E:\\ramtek3----WithPdfMErge";
    const destPdf = "C:\\tmp\\pdfMerge"
    await pngToPdf(folderForPngs, destPdf);
}
async function execFixed() {
    //const tifFoldersForTransformation = ['D:\\NMM\\August-2019\\02-08-2019\\M-37-Brahma Karma Suchay - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-38-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-39-Vanadurga - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-40-Ganapati Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-41-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-42-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-43-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection']
    const tifFoldersForTransformation = ["C:\\tmp\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection"]
    //const tifFoldersForTransformation = ["C:\\tmp\\x2"];
    const destPdf = "C:\\tmp\\pdfA111";

    //console.log(`${tifFoldersForTransformation}`)
    //await exec(tifFoldersForTransformation, destPdf)
    //await exec(["C:\\tmp\\tifs","C:\\tmp\\tifs2","C:\\tmp\\tifs3"], "C:\\tmp\\pdfDest8");

    await exec(tifFoldersForTransformation, destPdf)

    // await checkPageCountEqualsImgCountusingPdfLib(pdfName, (await getAllTifs(y)).length);
}
async function execSplit() {

}
//execDynamic();
execFixed();
//directlyFromPngs()


