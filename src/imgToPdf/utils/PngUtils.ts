import { getAllPngs, getAllTifs } from "./ImgUtils";
import * as path from 'path';
import * as fs from 'fs';

const sharp = require("sharp")

export function pngFolderName(src:string, dest:string){
    const folderName = dest + "\\" + path.parse(src).name
    if (!fs.existsSync(folderName)){
        fs.mkdirSync(folderName);
    }
    return folderName;
}
export async function tifftoPngs(src:string, dest:string){
    const tiffs = await getAllTifs(src);
    const folderForPngs = pngFolderName(src,dest);
    for(let tiff of tiffs){
        await tiffToPng(tiff,folderForPngs)
    }
    const pngCount = (await getAllPngs(folderForPngs)).length
    return {tiffsCount: tiffs.length, pngCount, countMatch: tiffs.length == pngCount };
}

async function tiffToPng(tifFile:string, dest:string){
    const tifFileName = dest + "\\" + path.parse(tifFile).name + ".png";
    const png = await sharp(tifFile)
    .png()
    .toFile(tifFileName)
}
