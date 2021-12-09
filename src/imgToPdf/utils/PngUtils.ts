import { getAllPngs, getAllTifs } from "./ImgUtils";
import * as path from 'path';
import * as fs from 'fs';
const sharp = require("sharp");

export function pngFolderName(src: string, dest: string) {
    const folderName = dest + "\\" + path.parse(src).name
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }
    return folderName;
}
export async function tiftoPngs(tifSrc: string, dest: string) {
    const tifs = await getAllTifs(tifSrc);
    const folderForPngs = pngFolderName(tifSrc, dest);

    return Promise.all(tifs.map((tif) => tifToPng(tif, folderForPngs))).then(async () => {
        const pngCount = (await getAllPngs(folderForPngs)).length
        //console.log({ tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount })
        return { tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount };
    });
}

async function tifToPng(tifFile: string, dest: string) {
    const tifFileName = dest + "\\" + path.parse(tifFile).name + ".png";
    const png = await sharp(tifFile)
        .png()
        .toFile(tifFileName)
}
