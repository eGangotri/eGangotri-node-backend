import { tifToPdf } from './TifToPdf';
import { getAllTifs } from './utils/ImgUtils';
import {
    folderCountEqualsPDFCount, formatTime,
    garbageCollect, getAllPdfs, 
    getDirectories, getUploadableFolders
} from './utils/Utils';
require('expose-gc');

export let GENERATION_REPORT = [];

const FOLDERS = getUploadableFolders("D:\\NMM\\August-2019", "E:\\ramtek");
const index = 2;
(async () => {
    console.log(FOLDERS)
    console.log(`This Run will convert Tiffs in Folder # ${index + 1} ${FOLDERS[index].src} to ${FOLDERS[index].dest}`);
    const x = true;
    if (x) {
        garbageCollect()
        process.exit(0);
    }
    const src = FOLDERS[index].src
    const dest = FOLDERS[index].dest;

    const subfolders = getDirectories(src);

    console.log(`TifToPDF started for ${subfolders.length} Folder(s)\n\t${subfolders.join("\n\t")}`)
    const START_TIME = Number(Date.now())

    GENERATION_REPORT.push(`TifToPDF started for ${subfolders.length} folder(s) at ${START_TIME}`)
    let subFolderCount = 0;
    for (let subfolder of subfolders) {
        const forderForPdfizeing = `${src}\\${subfolder}`;
        console.log(`\n${++subFolderCount}).Processing ${(await getAllTifs(forderForPdfizeing)).length}Tiffs in Folder \n\t${forderForPdfizeing}`)
        await tifToPdf(forderForPdfizeing, dest)
        garbageCollect()
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(subfolders.length, dest));
    GENERATION_REPORT.push(`TifToPDF ended at ${END_TIME}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
