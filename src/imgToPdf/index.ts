import { getAllTifs } from './utils/ImgUtils';
import {
    folderCountEqualsPDFCount, formatTime,
    garbageCollect, 
     getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';

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
    const tiffSubFolders = await getDirectoriesWithFullPath(src);
    console.log(`${tiffSubFolders}`)
    await exec(tiffSubFolders, dest)
}

async function exec(tiffSubFolders: Array<string>, pdfDest: string) {
    if (!fs.existsSync(pdfDest)) {
        fs.mkdirSync(pdfDest);
    }
    const tiffSubFoldersCount = tiffSubFolders.length;
    console.log(`TifToPDF started for ${tiffSubFoldersCount} Folder(s)\n\t${tiffSubFolders.join("\n\t")}`)
    const START_TIME = Number(Date.now())

    GENERATION_REPORT.push(`TifToPDF started for ${tiffSubFoldersCount} folder(s) at ${new Date(START_TIME)}`)

    let tiffSubFolderCounter = 0;
    for (let tiffSubFolder of tiffSubFolders) {
        console.log(`\n${++tiffSubFolderCounter} of ${tiffSubFoldersCount}).`)
        await tifToPdf(tiffSubFolder, pdfDest)
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(tiffSubFolders.length, pdfDest));
    GENERATION_REPORT.push(`TifToPDF ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
}

async function execFixed() {
    //const tiffSubFolders = ['D:\\NMM\\August-2019\\02-08-2019\\M-37-Brahma Karma Suchay - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-38-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-39-Vanadurga - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-40-Ganapati Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-41-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-42-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 'D:\\NMM\\August-2019\\02-08-2019\\M-43-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection']
    const tiffSubFolders = ["D:\\NMM\\August-2019\\03-08-2019\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection"]

    //const destPdf = "E:\\ramtek2--";
    const destPdf = "E:\\ramtek3--";
    //console.log(`${tiffSubFolders}`)
    await exec(tiffSubFolders, destPdf)
    //await exec(["C:\\tmp\\tiffs","C:\\tmp\\tiffs2","C:\\tmp\\tiffs3"], "C:\\tmp\\pdfDest6");
}

//execDynamic();
execFixed();

