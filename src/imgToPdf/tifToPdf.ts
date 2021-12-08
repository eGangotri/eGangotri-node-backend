import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { tifftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './index';
import { formatTime } from './utils/Utils';

export async function tifToPdf(tifSrc: string, destPdf: string) {
    const START_TIME = Number(Date.now())
    const tiffCount = await tifftoPngs(tifSrc, destPdf)
    const END_TIME = Number(Date.now())
    console.log(`tifftoPngs ended at ${new Date(END_TIME)}.
    Total Time Taken ${formatTime(END_TIME - START_TIME)}`);

    if (tiffCount.countMatch) {
        const START_TIME = Number(Date.now())
        await createPdfAndDeleteGeneratedFiles(tifSrc, destPdf);
    const END_TIME = Number(Date.now())
    console.log(`createPdfAndDeleteGeneratedFiles ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);

    }
    else {
        const err = `Error!!!
        \t ${tifSrc} 
        \t ${destPdf}
        Tiff Count(${tiffCount.tiffsCount}) != Png Count(${tiffCount.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

