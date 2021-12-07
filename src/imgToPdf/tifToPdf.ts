import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { tifftoPngs } from './utils/PngUtils';
import * as fs from 'fs';
import { GENERATION_REPORT } from './index';



export async function tifToPdf(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }
    const tiffCount = await tifftoPngs(src, dest)
    if (tiffCount.countMatch) {
        await createPdfAndDeleteGeneratedFiles(src, dest);
    }
    else {
        const err = `Error!!!
        \t ${src} 
        \t ${dest}
        Tiff Count(${tiffCount.tiffsCount}) != Png Count(${tiffCount.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

