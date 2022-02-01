import {
    formatTime,
    getDirectoriesWithFullPath, getUploadableFolders, mkDirIfDoesntExists
} from '../utils/Utils';
import * as fs from 'fs';
import { tifToPdf } from '../TifToPdf';
import * as path from 'path';
import { addReport, printReport } from '..';
import * as _ from 'lodash';

async function execDynamic(index:number, nmmFolder:string, localFolder:string) {
    const FOLDERS = await getUploadableFolders(nmmFolder, localFolder + "\\");
    //const FOLDERS = await getUploadableFolders("D:\\NMM\\July-2019", "E:\\July-2019\\");
    //const FOLDERS = await getUploadableFolders("D:\\NMM\\Oct-2019", "E:\\Oct-2019\\");
    if(FOLDERS.length <= index){
        console.log(`Provided index ${index} is higher than 0-based Index of No. of Folders(${FOLDERS.length}). Quitting`);
        return;
    }
    console.log(FOLDERS)
    console.log(`This Run will convert tifs in Folder # ${index + 1}
   
    ${FOLDERS[index].src} to 
    ${FOLDERS[index].dest}`);

    const src = FOLDERS[index].src
    const rootSrcFolders = await getDirectoriesWithFullPath(src);
    const dest = FOLDERS[index].dest + `(${ rootSrcFolders.length})`;
    console.log(rootSrcFolders)
    console.log(dest)
    try{
        await exec(rootSrcFolders, dest)
    }
    catch(e){
        console.log("error",e);
    }
}

async function exec(rootSrcFolders: Array<string>, destFolder: string) {
    await mkDirIfDoesntExists(destFolder);

    const rootSrcFoldersCount = rootSrcFolders.length;
    const START_TIME = Number(Date.now())
    addReport(`TifToPDF started for ${rootSrcFoldersCount} folder(s) at ${new Date(START_TIME)}
    \t${rootSrcFolders.map((elem, index) => `(${index+1}). ${elem}`).join("\n\t")}`)
    let execCounter = 0
    for (let rootSrcFolder of rootSrcFolders) {
        try {
            const START_TIME = Number(Date.now())
            addReport(`${++execCounter} of ${rootSrcFoldersCount}) ${rootSrcFolder} -> ${destFolder}`)
            await tifToPdf(rootSrcFolder, destFolder);
            const END_TIME = Number(Date.now())
            console.log(`tifToPdf for 
            ${path.parse(rootSrcFolder).name} ->
            ${path.parse(destFolder).name} ended at ${new Date(END_TIME)}.
            \nTotal Time Taken for converting
            ${path.parse(rootSrcFolder).name} -> ${path.parse(destFolder).name}
            ${formatTime(END_TIME - START_TIME)}`);
        }
        catch(e){
            console.log(`tifToPdf Error for ${rootSrcFolder} -> ${destFolder}` , e)
        }
    }
    const END_TIME = Number(Date.now())
    GRAND_TOTAL_TIME += END_TIME - START_TIME
    addReport(`TifToPDF for ${rootSrcFolders.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}

async function execFixed(rootSrcFolder:string, destFolder:string = '') {
    const rootSrcFolders = await getDirectoriesWithFullPath(rootSrcFolder)
    if(!destFolder){
        destFolder = rootSrcFolder + "_dest"
    }
    await exec(rootSrcFolders, destFolder);
}

async function execMultiple(_ranges:number[], nmmFolder:string, localFolder:string){
    const START_TIME = Number(Date.now())
    for (const index of _ranges) {
        console.log(`Processing index ${index} Range:(${_ranges})`);
        await execDynamic(index, nmmFolder, localFolder)
        console.log(`TIME SPENT SO FAR:  ${formatTime(GRAND_TOTAL_TIME)}`)
    }
    console.log(`GRAND_TOTAL_TIME:  ${formatTime(GRAND_TOTAL_TIME)}`)
    const END_TIME = Number(Date.now())
    console.log(`execMultiple:  ${formatTime(END_TIME-START_TIME)}`)
}

//execFixed("D:\\NMM\\May-2020\\28-05-2020");
const mmYYYY = "July-2020"
const _nmm = `D:/NMM/${mmYYYY}`
const _local = `E:/${mmYYYY}`
let GRAND_TOTAL_TIME = 0;
const x = 12
const increment = x+3
execMultiple(_.range(x,increment), _nmm, _local);
