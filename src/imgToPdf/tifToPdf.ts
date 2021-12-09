import { createPdfAndDeleteGeneratedFiles } from './utils/PdfUtils';
import { pngFolderName, tiftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './index';
import { formatTime } from './utils/Utils';
import { getAllTifs } from './utils/ImgUtils';

export async function tifToPdf(tifSrc: string, destPdf: string) {
    const tifCount = (await getAllTifs(tifSrc)).length
    console.log(`Converting ${tifCount} tifs in Folder \n\t${tifSrc}`)

    const tifToPngStats = await tiftoPngs(tifSrc, destPdf)

    if (tifToPngStats.countMatch) {
        const folderForPngs = pngFolderName(tifSrc, destPdf);
        pngToPdf(folderForPngs,destPdf)
    }
    else {
        const err = `Error!!!
        \t ${tifSrc} 
        \t ${destPdf}
        Tiff Count(${tifToPngStats.tifsCount}) != Png Count(${tifToPngStats.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

export async function pngToPdf(folderForPngs:string, destPdf:string){
    const START_TIME = Number(Date.now())
        await createPdfAndDeleteGeneratedFiles(folderForPngs, destPdf);
        const END_TIME = Number(Date.now())
        console.log(`createPdfAndDeleteGeneratedFiles ended at ${new Date(END_TIME)}.
    \nTotal Time Taken ${formatTime(END_TIME - START_TIME)}`);
}

