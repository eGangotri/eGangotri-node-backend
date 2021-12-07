import { tifToPdf } from './TifToPdf';
import { folderCountEqualsPDFCount, formatTime, getDirectories } from './utils/Utils';

export let GENERATION_REPORT = [];

(async () => {
    const src = "D:\\NMM\\August-2019\\01-08-2019"
    const dest = "E:\\ramtek"
    const subfolders = getDirectories(src);

    console.log(`TifToPDF started for ${subfolders.length} Folder(s)\n\t${subfolders.join("\n\t")}`)
    const START_TIME = Number(Date.now())

    GENERATION_REPORT.push(`TifToPDF started for ${subfolders.length} folder(s) at ${START_TIME}`)

    for (let subfolder of subfolders) {
        const forderForPdfizeing = `${src}\\${subfolder}`;
        console.log(`processing Tiffs in Folder \n\t${forderForPdfizeing}`)
        await tifToPdf(forderForPdfizeing, dest)
    }
    const END_TIME = Number(Date.now())
    GENERATION_REPORT.push(await folderCountEqualsPDFCount(subfolders.length, dest));
    GENERATION_REPORT.push(`TifToPDF ended at ${END_TIME}.\nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
    console.log(GENERATION_REPORT);
})();
