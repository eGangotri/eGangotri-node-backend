import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { tifftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './index';

export async function tifToPdf(tifSrc: string, destPdf: string) {
    const tiffCount = await tifftoPngs(tifSrc, destPdf)
    if (tiffCount.countMatch) {
        await createPdfAndDeleteGeneratedFiles(tifSrc, destPdf);
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

