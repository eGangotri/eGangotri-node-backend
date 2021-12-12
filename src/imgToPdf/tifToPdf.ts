import { pngFolderName, tiftoPngs } from './utils/PngUtils';
import { GENERATION_REPORT } from './index';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import { distributedLoadBasedPnToPdfConverter } from './pngToPdf';

export async function tifToPdf(tifRootFolder: string, destPdf: string) {
    if (!fs.existsSync(destPdf)) {
        fs.mkdirSync(destPdf);
    }
    const tifCount = (await getAllTifs(tifRootFolder)).length
    console.log(`Converting ${tifCount} tifs from Folder \n\t${tifRootFolder}  to pngs`)

    try {
        let tifToPngStats = await tiftoPngs(tifRootFolder, destPdf)
        if (tifToPngStats?.countMatch) {
            console.log("Tif->Png COnversion Over with 100% Count Match");
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
    catch (e) {
        console.log("----", e);
    }
}

