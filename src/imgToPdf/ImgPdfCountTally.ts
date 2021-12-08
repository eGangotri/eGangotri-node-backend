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

const tiffFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
const pdfFolder = "E:\\ramtek2-";
const index = 2;
(async () => {
    let NOT_CREATED_COUNT = 0;
    let NON_MATCHING_COUNT = 0;
    let MATCHING_COUNT = 0;
    let UNCHECKABLE_COUNT = 0;

    const tiffSubFolders: Array<string> = getDirectories(tiffFolderMain)
    const START_TIME = Number(Date.now())
    console.log(`Tally Check started for ${tiffSubFolders.length} Folder(s)\n\t${tiffSubFolders.join("\n\t")} at ${START_TIME}`)
    GENERATION_REPORT.push(`Tally Check started for ${tiffSubFolders.length} folder(s) `)

    let subFolderCount = 0;
    for (let subfolder of tiffSubFolders) {
        const folderForChecking = `${tiffFolderMain}\\${subfolder}`;
        const pdfPath = `${pdfFolder}\\${subfolder}.pdf`
        console.log(`Testing Item #${++subFolderCount}).${pdfPath}\n`);

        if (!fs.existsSync(pdfPath)) {
            console.log(`****Error ${pdfPath} was never created`);
            GENERATION_REPORT.push(`****Error ${pdfPath} was never created`);
            NOT_CREATED_COUNT++
            continue;
        }
        console.log(`exists ${pdfPath}`);

        const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;
        const tiffCount = (await getAllTifs(folderForChecking)).length;

        if ((pdfPageCount) === tiffCount) {
            MATCHING_COUNT++
            GENERATION_REPORT.push(`pdf ${subfolder}.pdf has matching count ${(tiffCount)}\n`);
        }
        else {
            if(pdfPageCount>0){
                NON_MATCHING_COUNT++
            }
            else {
                UNCHECKABLE_COUNT++
            }
            GENERATION_REPORT.push(`
            ****PDF Count  (${pdfPageCount}) for ${subfolder}.pdf is not same as ${tiffCount}\n`);
        }

    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(`Stats:
    NON_MATCHING_COUNT: ${NON_MATCHING_COUNT}
    MATCHING_COUNT: ${MATCHING_COUNT}
    UNCHECKABLE_COUNT: ${UNCHECKABLE_COUNT}
    NOT_CREATED_COUNT: ${NOT_CREATED_COUNT}
    Total Tiff Folders expected for Conversion: ${tiffSubFolders.length}
    Total PDFs in Folder: ${getAllPdfs(pdfFolder).length}
    `);
    GENERATION_REPORT.push(`Tally Check ended at ${END_TIME}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
