import {
    folderCountEqualsPDFCount, formatTime,
    garbageCollect, 
     getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { pngToPdf, tifToPdf } from './TifToPdf';
"use strict";

export let GENERATION_REPORT = [];

async function execDynamic() {
    const index = 2;
    const FOLDERS = await getUploadableFolders("D:\\NMM\\August-2019", "E:\\");
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1} 
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const dest = FOLDERS[index].dest;
    const tifSubFolders = await getDirectoriesWithFullPath(src);
    console.log(`${tifSubFolders}`)
    await exec(tifSubFolders, dest)
}

async function exec(tifSubFolders: Array<string>, pdfDest: string) {
    if (!fs.existsSync(pdfDest)) {
        fs.mkdirSync(pdfDest);
    }
    const tifSubFoldersCount = tifSubFolders.length;
    console.log(`TifToPDF started for ${tifSubFoldersCount} Folder(s)\n\t${tifSubFolders.join("\n\t")}`)
    const START_TIME = Number(Date.now())

    GENERATION_REPORT.push(`TifToPDF started for ${tifSubFoldersCount} folder(s) at ${new Date(START_TIME)}`)

    let tifSubFolderCounter = 0;
    for (let tifSubFolder of tifSubFolders) {
        console.log(`\n${++tifSubFolderCounter} of ${tifSubFoldersCount}).`)
        await tifToPdf(tifSubFolder, pdfDest)
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(tifSubFolders.length, pdfDest));
    GENERATION_REPORT.push(`TifToPDF ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
}

async function directlyFromPngs(){
const folderForPngs:string = "E:\\ramtek3----WithPdfMErge";

const destPdf = "C:\\tmp\\pdfMerge"

//"E:\\ramtek3--"

    await pngToPdf(folderForPngs,destPdf);
}
async function execFixed() {
    // const tifSubFolders = ['D:\\NMM\\August-2019\\02-08-2019\\M-37-Brahma Karma Suchay - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-38-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-39-Vanadurga - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-40-Ganapati Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-41-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-42-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-43-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection']
    // const destPdf = "E:\\ramtek2---";
    
    const tifSubFolders = ["D:\\NMM\\August-2019\\03-08-2019\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection"]
    const destPdf = "E:\\ramtek3----WithPdfMErge";

    //console.log(`${tifSubFolders}`)
    //await exec(tifSubFolders, destPdf)
    //await exec(["C:\\tmp\\tifs","C:\\tmp\\tifs2","C:\\tmp\\tifs3"], "C:\\tmp\\pdfDest8");
    await exec(["C:\\tmp\\tifs"], "C:\\tmp\\pdf11");
}

//execDynamic();
execFixed();
//directlyFromPngs()


