import { getAllTifs } from "./ImgUtils";
import * as path from 'path';
const sharp = require("sharp")

export async function createPngs(src:string, dest:string){
    const tiffs = await getAllTifs(src);
    for(let tiff of tiffs){
        await tiffToPng(tiff,dest)
    }
}

async function tiffToPng(tifFile:string, dest:string){
    const tifFileName = dest + "\\" + path.parse(tifFile).name + ".png";

    const png = await sharp(tifFile)
    .png()
    .toFile(tifFileName)
    console.log(`created ${tifFileName}`)
}
