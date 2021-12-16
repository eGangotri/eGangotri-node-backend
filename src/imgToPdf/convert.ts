import {
    formatTime,
    getDirectoriesWithFullPath, getUploadableFolders
} from './utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from './TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '.';


async function execDynamic(index:number) {
    const FOLDERS = await getUploadableFolders("D:\\NMM\\August-2019", "E:\\");
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1} 
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const rootSrcFolders = await getDirectoriesWithFullPath(src);
    const dest = FOLDERS[index].dest + `(${ rootSrcFolders.length})`;
    console.log(rootSrcFolders)
    console.log(dest)
    await exec(rootSrcFolders, dest)
}

async function exec(rootSrcFolders: Array<string>, destFolder: string) {
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
    }
    const rootSrcFoldersCount = rootSrcFolders.length;
    const START_TIME = Number(Date.now())
    addReport(`TifToPDF started for ${rootSrcFoldersCount} folder(s) at ${new Date(START_TIME)}
    \t${rootSrcFolders.map((elem, index) => `(${index+1}). ${elem}`).join("\n\t")}`)

    for (let rootSrcFolder of rootSrcFolders) {
        try {
            const START_TIME = Number(Date.now())
            await tifToPdf(rootSrcFolder, destFolder);
            const END_TIME = Number(Date.now())
            console.log(`tifToPdf for ${path.parse(rootSrcFolder).name} -> ${path.parse(destFolder).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(rootSrcFolder).name} -> ${path.parse(destFolder).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${rootSrcFolder} -> ${destFolder}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(`TifToPDF for ${rootSrcFolders.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}

async function execFixed() {
    const rootSrcFolders =  ["C:\\tmp\\expWithSmallFiles\\Kalidas"];//await getDirectoriesWithFullPath("C:\\tmp\\experiment")
    const destFolder = "C:\\tmp\\expWithSmallFilesDest";
    await exec(rootSrcFolders, destFolder);
}

    //last used was 6, then 5 again and next willl be 7
    //using 7
    //using 8
//execDynamic(8);
execFixed();


