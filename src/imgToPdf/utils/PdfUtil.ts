import {  getPdfPageCountUsingPdfLib } from "./PdfLibUtils";
import * as fs from 'fs';

import { addReport, INTRO_PAGE_ADJUSTMENT } from "..";
import { getAllTifs } from "./ImgUtils";

export const PDF_SIZE_LIMITATIONS = 2 * 1012 * 1024 * 1024

export async function checkPageCountEqualsImgCountInFolder(pdfWithFullPath: string, pngFolder: string) {
    const pngCount = (await getAllTifs(pngFolder)).length
    return checkPageCountEqualsImgCount(pdfWithFullPath, pngCount);
}

export async function checkPageCountEqualsImgCount(pdfPath: string, pngCount: number) {
    const pdfPageCount = await getPdfPageCountUsingPdfLib(pdfPath) - INTRO_PAGE_ADJUSTMENT;

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