import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { tifftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './index';
import { formatTime } from './utils/Utils';
import { getAllTifs } from './utils/ImgUtils';

export async function tifToPdf(tifSrc: string, destPdf: string) {
    const tiffCount = (await getAllTifs(tifSrc)).length
    console.log(`Converting ${tiffCount} tiffs in Folder \n\t${tifSrc}`)

    const tiffToPngStats = await tifftoPngs(tifSrc, destPdf)

    if (tiffToPngStats.countMatch) {
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
        Tiff Count(${tiffToPngStats.tiffsCount}) != Png Count(${tiffToPngStats.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

