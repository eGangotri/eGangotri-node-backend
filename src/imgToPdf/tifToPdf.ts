import { genPngFolderNameAndCreateIfNotExists, tiftoPngs } from './utils/PngUtils';
import { addReport, HANDLE_CHECKSUM } from './index';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import { distributedLoadBasedPngToPdfConverter } from './pngToPdfUtil';
import { getAllDotSumFiles } from './utils/Utils';

export async function tifToPdf(rootSrcFolder: string, destFolder: string) {
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
    }
    const tifCount = (await getAllTifs(rootSrcFolder)).length
    if(tifCount === 0){
        console.log(`No tifs in Folder \n\t${rootSrcFolder}.`);
        return;
    }
    console.log(`Converting ${tifCount} tifs from Folder \n\t${rootSrcFolder}  to pngs`)

    try {
        let tifToPngStats = await tiftoPngs(rootSrcFolder, destFolder)
        if (tifToPngStats?.countMatch) {
            console.log("Tif->Png conversion Over with 100% Count Match");
            const pngPdfDumpFolder = genPngFolderNameAndCreateIfNotExists(rootSrcFolder, destFolder);
            console.log(`pngPdfDumpFolder  ${pngPdfDumpFolder}`)
            const dotSumFiles:Array<string> = HANDLE_CHECKSUM ? await getAllDotSumFiles(rootSrcFolder):[]
            await distributedLoadBasedPngToPdfConverter(pngPdfDumpFolder,dotSumFiles)
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

