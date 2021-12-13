import {
    formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '.';


async function execDynamic() {
    const index = 4;
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
    addReport(`TifToPDF for ${tifFoldersForTransformation.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}


async function execFixed() {
    const tifFoldersForTransformation = ["C:\\Users\\manee\\Downloads\\a"]
    const destPdf = "C:\\Users\\manee\\Downloads\\a";
    await exec(tifFoldersForTransformation, destPdf);

}
execDynamic();
//execFixed();


