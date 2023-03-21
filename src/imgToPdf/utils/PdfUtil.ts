import { getFilzeSize, getPdfPageCountUsingPdfLib } from "./PdfLibUtils";
import * as fs from 'fs';
import { pdfPageCountUsingPdfJs } from "./PdfJsUtil";

import { addReport, INTRO_PAGE_ADJUSTMENT } from "..";
import { getAllTifs } from "./ImgUtils";

const ALGORITHMS = ["PDF_JS","PDF_LIB"]
export async function getPdfPageCount(pdfPath: string, algorithm:string = ALGORITHMS[1]) {
    let pageCount = -1
    if (getFilzeSize(pdfPath) <= 2) {
        if(algorithm === "PDF_JS"){
            try{
                pageCount = await pdfPageCountUsingPdfJs(pdfPath);
            }
            catch(e:any){
                console.log(`pageCount Error, $e`)
            }
        }
        else if (algorithm  === "PDF_LIB") {
            pageCount = await getPdfPageCountUsingPdfLib(pdfPath)
        }
        else {
            return -100;
        }
    }
    return pageCount;
}




export async function checkPageCountEqualsImgCountInFolder(pdfWithFullPath: string, pngFolder: string) {
    const pngCount = (await getAllTifs(pngFolder)).length
    return checkPageCountEqualsImgCount(pdfWithFullPath, pngCount);
}

export async function checkPageCountEqualsImgCount(pdfPath: string, pngCount: number) {
    const pdfPageCount = await getPdfPageCount(pdfPath) - INTRO_PAGE_ADJUSTMENT;

    if (pdfPageCount === pngCount) {
        addReport(`${pdfPath}(${pngCount}) created with PageCount same as png count(${pngCount})`)
    }
    else if (pdfPageCount === -1) {
        addReport(`${pdfPath} is over threshhold size. pls check if same as ${pngCount}`);
    }
    else {
        addReport(`***Error
        Image Count (${pngCount}) and PDF Count (${pdfPageCount}) at variance by ${pngCount - pdfPageCount}
        for  ${pdfPath} !!!`)
    }
    return pdfPageCount === pngCount
}