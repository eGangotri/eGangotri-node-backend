import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';

import {
    formatTime,
     garbageCollect,
     getAllPdfs,
    getDirectories,
    heapStats
} from './utils/Utils';
import { addReport, INTRO_PAGE_ADJUSTMENT, printReport } from './index';
import { pdfPageCountUsingPdfJs } from './utils/PdfJsUtil';
import { getPdfPageCount } from './utils/PdfUtil';


// const tifFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
// const pdfFolder = "E:\\ramtek2-";

const tifFolderMain = "D:\\NMM\\August-2019\\03-08-2019";
const pdfFolder = "E:\\ramtek-3";

(async () => {
    let NOT_CREATED = [];
    let NON_MATCHING = [];
    let MATCHING = [];
    let UNCHECKABLE = [];

    heapStats();
    garbageCollect()
    const pdfCounts = (await getAllPdfs(pdfFolder)).length
    const tifSubFolders: Array<string> = await getDirectories(tifFolderMain)
    const START_TIME = Number(Date.now())
    console.log(`Tally Check started for ${tifSubFolders.length} Folder(s)
    \n\t${tifSubFolders.join("\n\t")}
     at ${new Date(START_TIME)}`);

    addReport(`Tally Check started for ${tifSubFolders.length} folder(s) `)

    let subFolderCount = 0;
    for (let subfolder of tifSubFolders) {
        const folderForChecking = `${tifFolderMain}\\${subfolder}`;
        const pdfPath = `${pdfFolder}\\${subfolder}.pdf`
        subFolderCount++
        console.log(`Testing Item #${subFolderCount} of ${pdfCounts} pdfs :${pdfPath}\n`);
        if (!fs.existsSync(pdfPath)) {
            addReport(`****Error ${pdfPath} was never created`);
            NOT_CREATED.push(folderForChecking);
            continue;
        }
        const pdfPageCount = (await getPdfPageCount(pdfPath)) - INTRO_PAGE_ADJUSTMENT;
        const tifCount = (await getAllTifs(folderForChecking)).length;

        if ((pdfPageCount) === tifCount) {
            MATCHING.push(folderForChecking);
            addReport(`pdf ${subfolder}.pdf(${pdfPageCount}) Page Count == PNG Count ${(tifCount)}\n`);
        }
        else {
            if(pdfPageCount>0){
                NON_MATCHING.push(folderForChecking);
            }
            else {
                UNCHECKABLE.push(folderForChecking + ` should have ${tifCount+INTRO_PAGE_ADJUSTMENT} pages`);
            }
            addReport(`
            ****PDF Count  (${pdfPageCount}) for ${subfolder}.pdf is not same as ${tifCount}\n`);
        }

    }
    const END_TIME = Number(Date.now())
    addReport(`Stats:
    NON_MATCHING_COUNT: ${NON_MATCHING.length}
    MATCHING_COUNT: ${MATCHING.length}
    UNCHECKABLE_COUNT: ${UNCHECKABLE.length}
    NOT_CREATED_COUNT: ${NOT_CREATED.length}
    Total Tiff Folders expected for Conversion: ${tifSubFolders.length}
    Total PDFs in Folder: ${pdfCounts}
    Ready For Upload: ${MATCHING}
    Manually check ${UNCHECKABLE}
    Reconvert [${(NOT_CREATED.map((x)=>`"${x}"`)).join(",\n")}]
    Error Margin: ${tifSubFolders.length} - ${pdfCounts} = ${tifSubFolders.length - pdfCounts}
    `);
    addReport(`Tally Check ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
     printReport();;
})();
