import { pngFolderName, tiftoPngs } from './utils/PngUtils';
import { addReport } from './index';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import { distributedLoadBasedPngToPdfConverter } from './pngToPdfUtil';

export async function tifToPdf(rootSrcFolder: string, destFolder: string) {
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
    }
    const tifCount = (await getAllTifs(rootSrcFolder)).length
    console.log(`Converting ${tifCount} tifs from Folder \n\t${rootSrcFolder}  to pngs`)

    try {
        let tifToPngStats = await tiftoPngs(rootSrcFolder, destFolder)
        if (tifToPngStats?.countMatch) {
            console.log("Tif->Png conversion Over with 100% Count Match");
            await distributedLoadBasedPngToPdfConverter(rootSrcFolder, destFolder)
        }
        else {
            const err = `Error!!!
            \t ${rootSrcFolder} 
            \t ${destFolder}
            Tiff Count(${tifToPngStats.tifsCount}) != Png Count(${tifToPngStats.pngCount}) mismatch. 
            Will not proceed`;
            addReport(err)
            console.log(err);
        }
    }
    catch (e) {
        console.log("----", e);
    }
}

