import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';

import {
    formatTime,
     getAllPdfs,
    getDirectories
} from './utils/Utils';
import { getPdfPageCount } from './utils/PdfLibUtils';
import { INTRO_PAGE_ADJUSTMENT } from './utils/constants';
require('expose-gc');

export let GENERATION_REPORT = [];

// const tiffFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
// const pdfFolder = "E:\\ramtek2-";

const tiffFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
const pdfFolder = "E:\\ramtek2-";

(async () => {
    let NOT_CREATED = [];
    let NON_MATCHING = [];
    let MATCHING = [];
    let UNCHECKABLE = [];

    const pdfCounts = (await getAllPdfs(pdfFolder)).length
    const tiffSubFolders: Array<string> = await getDirectories(tiffFolderMain)
    const START_TIME = Number(Date.now())
    console.log(`Tally Check started for ${tiffSubFolders.length} Folder(s)
    \n\t${tiffSubFolders.join("\n\t")}
     at ${new Date(START_TIME)}`);

    GENERATION_REPORT.push(`Tally Check started for ${tiffSubFolders.length} folder(s) `)

    let subFolderCount = 0;
    for (let subfolder of tiffSubFolders) {
        const folderForChecking = `${tiffFolderMain}\\${subfolder}`;
        const pdfPath = `${pdfFolder}\\${subfolder}.pdf`
        subFolderCount++
        console.log(`Testing Item #${subFolderCount} of ${pdfCounts} pdfs :${pdfPath}\n`);
        if (!fs.existsSync(pdfPath)) {
            console.log(`****Error ${pdfPath} was never created`);
            GENERATION_REPORT.push(`****Error ${pdfPath} was never created`);
            NOT_CREATED.push(folderForChecking);
            continue;
        }

        const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;
        const tiffCount = (await getAllTifs(folderForChecking)).length;

        if ((pdfPageCount) === tiffCount) {
            MATCHING.push(folderForChecking);
            GENERATION_REPORT.push(`pdf ${subfolder}.pdf has matching count ${(tiffCount)}\n`);
        }
        else {
            if(pdfPageCount>0){
                NON_MATCHING.push(folderForChecking);
            }
            else {
                UNCHECKABLE.push(folderForChecking);
            }
            GENERATION_REPORT.push(`
            ****PDF Count  (${pdfPageCount}) for ${subfolder}.pdf is not same as ${tiffCount}\n`);
        }

    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(`Stats:
    NON_MATCHING_COUNT: ${NON_MATCHING.length}
    MATCHING_COUNT: ${MATCHING.length}
    UNCHECKABLE_COUNT: ${UNCHECKABLE.length}
    NOT_CREATED_COUNT: ${NOT_CREATED.length}
    Total Tiff Folders expected for Conversion: ${tiffSubFolders.length}
    Total PDFs in Folder: ${pdfCounts}
    Manually check ${UNCHECKABLE}
    Reconvert [${(NOT_CREATED.map((x)=>`"${x}"`)).join(",")}]
    Error Margin: ${tiffSubFolders.length} - ${pdfCounts} = ${tiffSubFolders.length - pdfCounts}
    `);
    GENERATION_REPORT.push(`Tally Check ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
