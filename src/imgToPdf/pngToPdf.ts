import { chunkedPngsToChunkedPdfs, distributedLoadBasedPngToPdfConverter } from "./pngToPdfUtil";
import {
    formatTime, getDirectories, getDirectoriesWithFullPath
} from './utils/Utils';
import * as fs from 'fs';
import * as path from 'path';
import { addReport, printReport } from '.';
import { PNG_SUB_FOLDER } from "./utils/constants";



async function exec(rootFoldersForConversion: Array<string>) {
    const rootFoldersForConversionCount = rootFoldersForConversion.length;
    const START_TIME = Number(Date.now())
    addReport(`PngToPDF started for ${rootFoldersForConversionCount} folder(s) at ${new Date(START_TIME)}
    \t${rootFoldersForConversion.map((elem, index) => `(${index + 1}). ${elem}`).join("\n\t")}`)
    for (let rootFolder of rootFoldersForConversion) {
        try {
            console.log(`rootFolder ${rootFolder}`)
            const START_TIME = Number(Date.now())
            await chunkedPngsToChunkedPdfs(rootFolder);
            const END_TIME = Number(Date.now())
            console.log(`pngToPdf for ${path.parse(rootFolder).name} ended at ${new Date(END_TIME)}.
                \nTotal Time Taken for converting
                ${formatTime(END_TIME - START_TIME)}`);
        }
        catch (e) {
            console.log(`pngToPdf Error for ${rootFolder}`, e)
        }
    }
    const END_TIME = Number(Date.now())
    addReport(`pngToPDF for ${rootFoldersForConversion.length} Folder(s) ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    printReport();
}

(async () => {
    const rootFoldersForConversion = await getDirectoriesWithFullPath("C:\\tmp\\experimentDest")
    await exec(rootFoldersForConversion);
})()