import { chunkedPngsToChunkedPdfs, distributedLoadBasedPngToPdfConverter } from "./pngToPdfUtil";
import {
    formatTime, getAllDotSumFiles, getDirectories, getDirectoriesWithFullPath
} from './utils/Utils';
import * as fs from 'fs';
import * as path from 'path';
import { addReport, HANDLE_CHECKSUM, printReport } from '.';
import { PNG_SUB_FOLDER } from "./utils/constants";
import { genPngFolderNameAndCreateIfNotExists } from "./utils/PngUtils";



async function exec(rootFoldersForConversion: Array<string>, procChunkedPngs:boolean = true) {
    const rootFoldersForConversionCount = rootFoldersForConversion.length;
    const START_TIME = Number(Date.now())
    addReport(`PngToPDF exec started for ${rootFoldersForConversionCount} folder(s) at ${new Date(START_TIME)}
    \t${rootFoldersForConversion.map((elem, index) => `(${index + 1}). ${elem}`).join("\n\t")}`)
    for (let rootFolder of rootFoldersForConversion) {
        try {
            console.log(`rootFolder ${rootFolder}`)
            const START_TIME = Number(Date.now())
            const dotSumFiles:Array<string> = HANDLE_CHECKSUM ? await getAllDotSumFiles(rootFolder):[]
           
            if(procChunkedPngs){
                await chunkedPngsToChunkedPdfs(rootFolder);
            }
            else {
                await distributedLoadBasedPngToPdfConverter(rootFolder, dotSumFiles);
            }
            const END_TIME = Number(Date.now())
            console.log(`pngToPdf for ${path.parse(rootFolder).name} ended at ${new Date(END_TIME)}.
                \nTotal Time Taken for converting
                ${formatTime(END_TIME - START_TIME)}`);
        }
        catch (e) {
            addReport(`pngToPdf Error for ${rootFolder} ${e}`)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(`pngToPDF for ${rootFoldersForConversion.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}

async function chunkedPngsToPdf(){
    await exec([
        "E:\\July-2019\\reDo\\M-1981-Vinayak Mahatmya From Ganesh Puran - Kavikulguru Kalidas Sanskrit University Ramtek Collection"
    ], true);
}

async function rawPngsToPdf(){
    const rootFoldersForConversion = ["E:\\ramtek-11_shortBy1\\M-712-Aitareya Brahman - Kavikulguru Kalidas Sanskrit University Ramtek Collection"] 
    const paths = await getDirectoriesWithFullPath("E:\\July-2019\\ramtek-1_19-07-2019(21)\\reDo")
    //await exec([path0,path1], false); //
    await exec(paths, false); //
}
//chunkedPngsToPdf();
rawPngsToPdf();