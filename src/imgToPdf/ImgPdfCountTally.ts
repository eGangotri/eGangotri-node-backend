import { tifToPdf } from './TifToPdf';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';

import {
    folderCountEqualsPDFCount, formatTime,
    garbageCollect, getAllPdfs, 
    getDirectories, getUploadableFolders
} from './utils/Utils';
import { getPdfPageCount } from './utils/PdfLibUtils';
import { INTRO_PAGE_ADJUSTMENT } from './utils/constants';
require('expose-gc');

export let GENERATION_REPORT = [];

const tiffFolder = "D:\\NMM\\August-2019\\02-08-2019";
const pdfFolder = "E:\\ramtek2-";
const index = 2;
(async () => {
    const tiffFolders = getDirectories(tiffFolder)
    const START_TIME = Number(Date.now())
    console.log(`Tally Check started for ${tiffFolders.length} Folder(s)\n\t${tiffFolders.join("\n\t")} at ${START_TIME}`)
    GENERATION_REPORT.push(`Tally Check started for ${tiffFolders.length} folder(s) `)

    let subFolderCount = 0;
    for (let subfolder of tiffFolder) {
        const folderForChecking = `${tiffFolder}\\${subfolder}`;
        const pdfPath = `${pdfFolder}\\${subfolder}.pdf`
        console.log(`Testing ${subfolder}.pdf`);

        if(!fs.existsSync(pdfPath)){
            GENERATION_REPORT.push(`****Error ${subfolder}.pdf was never created`);
            continue;
        }
        const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;
        const tiffCount = (await getAllTifs(subfolder)).length;

        if( (pdfPageCount)  === tiffCount){
            GENERATION_REPORT.push(`pdf ${subfolder}.pdf has matching count ${(tiffCount)}`);
        }
        else{
            GENERATION_REPORT.push(`
            ****PDF Count  (${pdfPageCount}) is not same as ${tiffCount} fpr `);
        }
        
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(`Tally Check ended at ${END_TIME}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
