import { pngFolderName, tiftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './convert';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import { distributedLoadBasedPnToPdfConverter } from './pngToPdf';

export async function tifToPdf(tifRootFolder: string, destPdf: string) {
    if (!fs.existsSync(destPdf)) {
        fs.mkdirSync(destPdf);
    }
    const tifCount = (await getAllTifs(tifRootFolder)).length
    console.log(`--Converting ${tifCount} tifs in Folder \n\t${tifRootFolder}`)
    let tifToPngStats
    try {
        tifToPngStats = await tiftoPngs(tifRootFolder, destPdf)
    }
    catch (e) {
        console.log("----", e);
    }
    console.log("after tifToPngStats")
    if (tifToPngStats.countMatch) {
        const pngRootFolder = pngFolderName(tifRootFolder, destPdf);
        await distributedLoadBasedPnToPdfConverter(pngRootFolder, destPdf,tifCount)
        //await pngsToPdf(pngRootFolder,destPdf)
    }
    else {
        const err = `Error!!!
        \t ${tifRootFolder} 
        \t ${destPdf}
        Tiff Count(${tifToPngStats.tifsCount}) != Png Count(${tifToPngStats.pngCount}) mismatch. 
        Will not proceed`;
        GENERATION_REPORT.push(err)
        console.log(err);
    }
}

