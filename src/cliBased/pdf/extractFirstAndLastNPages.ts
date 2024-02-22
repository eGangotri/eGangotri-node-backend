import { PDFDocument, PDFPage } from 'pdf-lib';
import fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { createFolderIfNotExists, getAllPDFFiles } from 'imgToPdf/utils/FileUtils';
const fsPromises = require('fs').promises;

const firstNPages = 10
const lastNPages = 10
let FINAL_REPORT: string[] = [];
let PDF_PROCESSING_COUNTER = 0;

async function createPartialPdf(inputPath: string, outputPath: string, pdfsToBeProcessedCount: number, index: string): Promise<number> {
    const existingPdfBytes = await fsPromises.readFile(inputPath)

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    let range: number[] = []
    const pdfPageCount = pdfDoc.getPages().length

    console.log(`Pdf Extraction: Folder # (${index}) Pdf No. ${++counter}/${pdfsToBeProcessedCount} pdfPageCount ${pdfPageCount}`);

    if (pdfPageCount < (firstNPages + lastNPages)) {
        range = _.range(0, pdfPageCount);
    }
    else {
        range = _.range(0, firstNPages).concat(_.range(pdfPageCount - lastNPages, pdfPageCount));
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, range);
    copiedPages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();

    const filename = path.parse(inputPath).name
    const suffixWithPageCount = padNumbersWithZeros(pdfPageCount)
    await fsPromises.writeFile(`${outputPath}//${filename}_${suffixWithPageCount}.pdf`, newPdfBytes);
    return pdfPageCount
}

export const loopFolderForExtraction = async (rootFolder: string, outputRoot: string, loopIndex: string) => {
    const allPdfs = await getAllPDFFiles(rootFolder)
    const pdfsToBeProcessedCount = allPdfs.length;
    const outputPath = `${outputRoot}\\${path.parse(rootFolder).name} (${pdfsToBeProcessedCount})`;
    console.log(`rootFolder ${rootFolder} ${outputRoot} ${loopIndex}`);
    createFolderIfNotExists(outputPath)
    for (const [index, pdf] of allPdfs.entries()) {
        const _path = path.parse(pdf.absPath);
        const subDir = _path.dir.replace(rootFolder, '')
        let _subFolder = `${outputPath}\\${subDir}`
        createFolderIfNotExists(_subFolder)
        try {
            await createPartialPdf(pdf.absPath, _subFolder, pdfsToBeProcessedCount, loopIndex);
            PDF_PROCESSING_COUNTER++;
        }
        catch (error) {
            console.error('Error creating PDF:', error);
        }
    }
    const consoleLog: string =
        `\nFolder # (${loopIndex}).${path.parse(rootFolder).name} PDF Count ${pdfsToBeProcessedCount} == PDF_PROCESSING_COUNTER ${PDF_PROCESSING_COUNTER} Match ${pdfsToBeProcessedCount === PDF_PROCESSING_COUNTER}`

    FINAL_REPORT.push(consoleLog);
    console.log(consoleLog);
}

const padNumbersWithZeros = (num: number) => {
    if (num < 10) {
        return `000${num}`
    }

    if (num < 100) {
        return `00${num}`
    }

    if (num < 1000) {
        return `0${num}`
    }

    return num
}
let counter = 0;

const loopFolders = async (_srcFoldersWithPath: string[], destRootFolder: string) => {
    try {
        for (const [index, folder] of _srcFoldersWithPath.entries()) {
            console.log(`Started processing ${folder}`)
            PDF_PROCESSING_COUNTER = 0;
            counter = 0
            await loopFolderForExtraction(folder, destRootFolder, `${index + 1}/${_srcFoldersWithPath.length}`);
        }
        console.log(`FINAL_REPORT(extractPages): ${FINAL_REPORT.map(x => x + "\n")}`)
    }
    catch (err) {
        console.log(err)
    }
}
const destRootFolder = "C:\\_catalogWork\\_reducedPdfs";

const srcRootFolder = 'H:\\eG-tr1-30';
const _folders = [20]
const _srcFoldersWithPath = _folders.map(x => `${srcRootFolder}\\Treasures${x}`)

loopFolders(_srcFoldersWithPath, destRootFolder)
//yarn run extractFirstAndLastNPages