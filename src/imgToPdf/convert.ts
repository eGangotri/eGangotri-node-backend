import {
    folderCountEqualsPDFCount, formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '.';


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
    const START_TIME = Number(Date.now())
    addReport(`TifToPDF started for ${tifFoldersForTransformationCount} folder(s) at ${new Date(START_TIME)}
    \t${tifFoldersForTransformation.map((elem, index) => `(${index+1}). ${elem}`).join("\n\t")}`)

    for (let mainFolder of tifFoldersForTransformation) {
        try {
            const START_TIME = Number(Date.now())
            await tifToPdf(mainFolder, pdfDest);
            const END_TIME = Number(Date.now())
            console.log(`tifToPdf for ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(mainFolder).name} -> ${path.parse(pdfDest).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${mainFolder} -> ${pdfDest}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(await folderCountEqualsPDFCount(tifFoldersForTransformation.length, pdfDest));
    addReport(`TifToPDF ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}


async function execFixed() {
    const rootFolder =  'D:\\NMM\\August-2019\\02-08-2019'
    const tifFoldersForTransformation = [ 
        `${rootFolder}\\M-37-Brahma Karma Sammuchaya - Kavikulguru Kalidas Sanskrit University Ramtek Collection`, 
  `${rootFolder}\\M-38-Devalaya Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection`, 
    `${rootFolder}\\M-40-Ganapati Kavach - Kavikulguru Kalidas Sanskrit University Ramtek Collection`,
     `${rootFolder}\\M-41-Devalaya Gram Mahatmya - Kavikulguru Kalidas Sanskrit University Ramtek Collection`, 
    ]
    // const tifFoldersForTransformation = ["C:\\tmp\\M-72-Sulabh Veda Prakash - Kavikulguru Kalidas Sanskrit University Ramtek Collection"]
    const destPdf = "E:\\ramtek211Dec";
    //await exec(["C:\\tmp\\tifs","C:\\tmp\\tifs2","C:\\tmp\\tifs3"], "C:\\tmp\\pdf1");

    await exec([tifFoldersForTransformation[3]], destPdf)

}
//execDynamic();
execFixed();


