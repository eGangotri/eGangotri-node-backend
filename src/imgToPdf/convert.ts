import {
    folderCountEqualsPDFCount, formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';

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
        try {
            const START_TIME = Number(Date.now())
            await tifToPdf(mainFolder, pdfDest);
            const END_TIME = Number(Date.now())
            console.log(`exec for ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${mainFolder} -> ${pdfDest}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(tifFoldersForTransformation.length, pdfDest));
    GENERATION_REPORT.push(`TifToPDF ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
}


async function execFixed() {
    const tifFoldersForTransformationX =
     ['D:\\NMM\\August-2019\\02-08-2019\\M-37-Brahma Karma Suchay - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 
    'D:\\NMM\\August-2019\\02-08-2019\\M-38-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 
    'D:\\NMM\\August-2019\\02-08-2019\\M-39-Vanadurga - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 
    'D:\\NMM\\August-2019\\02-08-2019\\M-40-Ganapati Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection',
     'D:\\NMM\\August-2019\\02-08-2019\\M-41-Devalay Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection', 
    'D:\\NMM\\August-2019\\02-08-2019\\M-42-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection',
     'D:\\NMM\\August-2019\\02-08-2019\\M-43-Haritalik Puja Katha_Rishi Panchami Puja Katha - Kavikulguru Kalidas Sanskrit University Ramtek Collection']
   
     const tifFoldersForTransformation = ["C:\\tmp\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection"]
    const destPdf = "E:\\ramtek2RemainingX";
    await exec(["C:\\tmp\\tifs","C:\\tmp\\tifs2","C:\\tmp\\tifs3"], "C:\\tmp\\pdf1");

    //await exec(tifFoldersForTransformation, destPdf)

}
//execDynamic();
execFixed();


