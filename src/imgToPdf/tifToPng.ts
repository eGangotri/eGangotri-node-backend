import { getAllTifs } from "./imgUtils";

const sharp = require("sharp")

export async function createPngs(src:string){
    const tiffs = await getAllTifs(src);
    for(let tiff of tiffs){
        await tiffToPng(tiff)
    }
}

async function tiffToPng(tifFile:string){
    const png = await sharp(tifFile)
    .png()
    .toFile(`${tifFile}.png`)
    console.log(`created ${tifFile}.png`)
}
