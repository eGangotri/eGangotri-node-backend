import {
    formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '.';


async function execDynamic() {
    //last used was 6
    const index = 6;
    const FOLDERS = await getUploadableFolders("D:\\NMM\\August-2019", "E:\\");
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1} 
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const rootFoldersForConversion = await getDirectoriesWithFullPath(src);
    const dest = FOLDERS[index].dest + `(${ rootFoldersForConversion.length})`;
    console.log(rootFoldersForConversion)
    console.log(dest)
    await exec(rootFoldersForConversion, dest)
}

async function exec(rootFoldersForConversion: Array<string>, destFolder: string) {
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
    }
    const rootFoldersForConversionCount = rootFoldersForConversion.length;
    const START_TIME = Number(Date.now())
    addReport(`TifToPDF started for ${rootFoldersForConversionCount} folder(s) at ${new Date(START_TIME)}
    \t${rootFoldersForConversion.map((elem, index) => `(${index+1}). ${elem}`).join("\n\t")}`)

    for (let rootFolder of rootFoldersForConversion) {
        try {
            const START_TIME = Number(Date.now())
            await tifToPdf(rootFolder, destFolder);
            const END_TIME = Number(Date.now())
            console.log(`tifToPdf for ${path.parse(rootFolder).name} -> ${path.parse(destFolder).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(rootFolder).name} -> ${path.parse(destFolder).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${rootFolder} -> ${destFolder}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(`TifToPDF for ${rootFoldersForConversion.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}

async function execFixed() {
    const rootFoldersForConversion =  await getDirectoriesWithFullPath("C:\\tmp\\experiment")
    const destFolder = "C:\\tmp\\experimentDest2";
    await exec(rootFoldersForConversion, destFolder);
}
//execDynamic();
execFixed();


