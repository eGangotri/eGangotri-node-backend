import { getAllPngs, getAllTifs } from "./ImgUtils";
import * as path from 'path';
import { size } from "lodash";
import { mkDirIfDoesntExists } from "./Utils";
const sharp = require("sharp");

const PNG_QUALITY_REDUCTION = 10;

let ALPHABETIC_ORDER: Array<string> = [];
const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

export function appendAlphaCode(numericTitle: string) {
    /***
     * some file names are like 0000123A/ 000123B
     */
    let appendix = ""
    if(numericTitle.endsWith("A") ){
        appendix  = "1"
    }
    else if( numericTitle.endsWith("B")){
        appendix  = "2"
    } 
    else if(numericTitle.endsWith("C")){
        appendix  = "3"
    } 
    const _codedVal =  appendAlphaCodeForNum(parseInt(numericTitle), appendix);
    return _codedVal
}

export function appendAlphaCodeForNum(numericTitle: number, appendix:string = '') {
    return (isNaN(numericTitle) ? '' : getAlphaOrdered(numericTitle) + "_") + numericTitle + appendix;
}
function getAlphaOrdered(index: number) {
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

export async function genPngFolderNameAndCreateIfNotExists(src: string, dest: string) {
    const folderName = dest + "\\" + path.parse(src).base
    await mkDirIfDoesntExists(folderName);
    return folderName;
}
export async function tiftoPngs(tifSrc: string, dest: string) {
    const tifs = await getAllTifs(tifSrc);
    const folderForPngs = await genPngFolderNameAndCreateIfNotExists(tifSrc, dest);
    const conversionPromises = tifs.map((tif) => {
        return tifToPng(tif, folderForPngs).catch(e => console.log(`Error in tifToPng`)) 
    })

    await Promise.all(conversionPromises)
    const pngCount = (await getAllPngs(folderForPngs)).length
    //console.log({ tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount })
    return { tifsCount: tifs.length, pngCount, countMatch: tifs.length == pngCount };
}

async function tifToPng(tifFile: string, dest: string) {
    const tifName = path.parse(tifFile).name
    const pngFileName = dest + "\\" + appendAlphaCode(tifName) + ".png";
    //console.log(`pngFileName ${pngFileName}`)
    await sharp(tifFile)
        .png({ quality: PNG_QUALITY_REDUCTION })
        .toFile(pngFileName)
}

