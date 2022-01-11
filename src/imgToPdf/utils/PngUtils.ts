import { getAllPngs, getAllTifs } from "./ImgUtils";
import * as path from 'path';
import * as fs from 'fs';
import { size } from "lodash";
const sharp = require("sharp");

const PNG_QUALITY_REDUCTION = 10;

let ALPHABETIC_ORDER:Array<string> = [];
const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
 "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

 export function appendAlphaCode(numericTitle: string){
    return appendAlphaCodeForNum(parseInt(numericTitle));
 }

 export function appendAlphaCodeForNum(numericTitle: number){
    return (isNaN(numericTitle) ? '': getAlphaOrdered(numericTitle) + "_" )+ numericTitle;
 }
function getAlphaOrdered(index:number) {
    if (ALPHABETIC_ORDER.length === 0) {
        alphabet.map((x) => {
            alphabet.map((y) => {
                alphabet.map((z) => {
                    ALPHABETIC_ORDER.push(`${x}${y}${z}`)
                })
            })
        });
    }
    return ALPHABETIC_ORDER[index];
}

export function genPngFolderNameAndCreateIfNotExists(src: string, dest: string) {
    const folderName = dest + "\\" + path.parse(src).name
    if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
    }
    return folderName;
}
export async function tiftoPngs(tifSrc: string, dest: string) {
    const tifs = await getAllTifs(tifSrc);
    const folderForPngs = genPngFolderNameAndCreateIfNotExists(tifSrc, dest);

    return Promise.all(tifs.map((tif) => tifToPng(tif, folderForPngs))).then(async () => {
        const pngCount = (await getAllPngs(folderForPngs)).length
        //console.log({ tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount })
        return { tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount };
    });
}

async function tifToPng(tifFile: string, dest: string) {
    const tifName = path.parse(tifFile).name
    const pngFileName = dest + "\\" + appendAlphaCode(tifName) + ".png";
    console.log(`pngFileName ${pngFileName}`)
    await sharp(tifFile)
        .png({ quality: PNG_QUALITY_REDUCTION })
        .toFile(pngFileName)
}

