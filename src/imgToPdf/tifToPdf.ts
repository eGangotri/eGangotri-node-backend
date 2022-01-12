import { genPngFolderNameAndCreateIfNotExists, tiftoPngs } from './utils/PngUtils';
import { addReport, HANDLE_CHECKSUM } from './index';
import { getAllTifs } from './utils/ImgUtils';
import * as fs from 'fs';
import { distributedLoadBasedPngToPdfConverter } from './pngToPdfUtil';
import { formatTime, getAllDotSumFiles, mkDirIfDoesntExists } from './utils/Utils';

export async function tifToPdf(rootSrcFolder: string, destFolder: string) {
    await mkDirIfDoesntExists(destFolder);

    const tifCount = (await getAllTifs(rootSrcFolder)).length
    if(tifCount === 0){
        console.log(`No tifs in Folder \n\t${rootSrcFolder}.`);
        return;
    }
    console.log(`Converting ${tifCount} tifs from Folder \n\t${rootSrcFolder}  to pngs`)

    try {
        const START_TIME = Number(Date.now())
        let tifToPngStats = await tiftoPngs(rootSrcFolder, destFolder)
        const END_TIME = Number(Date.now())
        console.log(`Tif2Png Time Taken ${formatTime(END_TIME - START_TIME)}`);

        if (tifToPngStats?.countMatch) {
            console.log("Tif->Png conversion Over with 100% Count Match");
            const pngPdfDumpFolder = await genPngFolderNameAndCreateIfNotExists(rootSrcFolder, destFolder);
            //console.log(`pngPdfDumpFolder  ${pngPdfDumpFolder}`)
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

