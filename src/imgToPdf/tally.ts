import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';

import {
    chunk,
    formatTime,
     garbageCollect,
     getAllPdfs,
    getDirectories,
    heapStats
} from './utils/Utils';
import { getPdfPageCount, mergeAllPdfsInFolder, mergePDFDocuments } from './utils/PdfLibUtils';
import { INTRO_PAGE_ADJUSTMENT } from './utils/constants';
import { removeExcept } from './utils/FileUtils';
import * as path from 'path';

export let GENERATION_REPORT:Array<string> = [];

// const tifFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
// const pdfFolder = "E:\\ramtek2-";

const tifFolderMain = "D:\\NMM\\August-2019\\02-08-2019";
const pdfFolder = "E:\\ramtek2-";

(async () => {
    let NOT_CREATED = [];
    let NON_MATCHING = [];
    let MATCHING = [];
    let UNCHECKABLE = [];

    heapStats();
    garbageCollect()
    const pdfDestFolderFotMergeTest = "C:\\tmp\\pdf10"
    const pdfName = pdfDestFolderFotMergeTest + "\\" +path.parse(pdfDestFolderFotMergeTest).name + ".pdf";
    //await mergeAllPdfsInFolder(pdfDestFolderFotMergeTest,pdfName);
    //removeExcept("C:\\tmp\\pdfMerge", ["C:\\tmp\\pdfMerge\\pdfMerge.pdf"])
    const xx = true
    console.log(chunk(["1","2", "3", "4", "5", "6", "7"], 0));
    console.log(chunk(["1","2", "3", "4", "5", "6", "7"], 5));
    console.log(chunk(["1","2", "3", "4", "5", "6", "7"], 20));

    if(xx){
        process.exit(0);
    }
    console.log(".....");

    const pdfCounts = (await getAllPdfs(pdfFolder)).length
    const tifSubFolders: Array<string> = await getDirectories(tifFolderMain)
    const START_TIME = Number(Date.now())
    console.log(`Tally Check started for ${tifSubFolders.length} Folder(s)
    \n\t${tifSubFolders.join("\n\t")}
     at ${new Date(START_TIME)}`);

    GENERATION_REPORT.push(`Tally Check started for ${tifSubFolders.length} folder(s) `)

    let subFolderCount = 0;
    for (let subfolder of tifSubFolders) {
        const folderForChecking = `${tifFolderMain}\\${subfolder}`;
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
        const tifCount = (await getAllTifs(folderForChecking)).length;

        if ((pdfPageCount) === tifCount) {
            MATCHING.push(folderForChecking);
            GENERATION_REPORT.push(`pdf ${subfolder}.pdf has matching count ${(tifCount)}\n`);
        }
        else {
            if(pdfPageCount>0){
                NON_MATCHING.push(folderForChecking);
            }
            else {
                UNCHECKABLE.push(folderForChecking);
            }
            GENERATION_REPORT.push(`
            ****PDF Count  (${pdfPageCount}) for ${subfolder}.pdf is not same as ${tifCount}\n`);
        }

    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(`Stats:
    NON_MATCHING_COUNT: ${NON_MATCHING.length}
    MATCHING_COUNT: ${MATCHING.length}
    UNCHECKABLE_COUNT: ${UNCHECKABLE.length}
    NOT_CREATED_COUNT: ${NOT_CREATED.length}
    Total Tiff Folders expected for Conversion: ${tifSubFolders.length}
    Total PDFs in Folder: ${pdfCounts}
    Manually check ${UNCHECKABLE}
    Reconvert [${(NOT_CREATED.map((x)=>`"${x}"`)).join(",")}]
    Error Margin: ${tifSubFolders.length} - ${pdfCounts} = ${tifSubFolders.length - pdfCounts}
    `);
    GENERATION_REPORT.push(`Tally Check ended at ${new Date(END_TIME)}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
