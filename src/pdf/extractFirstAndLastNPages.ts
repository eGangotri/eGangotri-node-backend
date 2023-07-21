import { PDFDocument, PDFPage } from 'pdf-lib';
import fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { createFolderIfNotExists, getAllPDFFiles } from '../imgToPdf/utils/FileUtils';
const fsPromises = require('fs').promises;


const firstNPages = 10
const lastNPages = 10
let FINAL_REPORT: string[] = [];
let PDF_PROCESSING_COUNTER = 0;

async function createPartialPdf(inputPath: string, outputPath: string, pdfsToBeProcessedCount: number, index: number): Promise<number> {
    const existingPdfBytes = await fsPromises.readFile(inputPath)

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    let range: number[] = []
    const pdfPageCount = pdfDoc.getPages().length

    console.log(`Pdf Trim: Folder # (${index}) Pdf No. ${++counter}/${pdfsToBeProcessedCount} pdfPageCount ${pdfPageCount}`);

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

export const loopForExtraction = async (rootFolder: string, outputRoot: string, loopIndex: number) => {

    const allPdfs = getAllPDFFiles(rootFolder)
    const pdfsToBeProcessedCount = allPdfs.length;
    const outputPath = `${outputRoot}\\${path.parse(rootFolder).name} (${pdfsToBeProcessedCount})`;

    createFolderIfNotExists(outputPath)
    for (const [index, pdf] of allPdfs.entries()) {
        const _path = path.parse(pdf);
        const subDir = _path.dir.replace(rootFolder+"\\",'')
        let _subFolder = `${outputPath}\\${subDir}`
        console.log(`_subFolder ${_subFolder} 
        _dir ${_path.dir} 
        _path.base ${_path.base}
         pdf ${pdf}
         rootFolder ${rootFolder}
         ${subDir}
         `);
        createFolderIfNotExists(_subFolder)

        try {
            await createPartialPdf(pdf, _subFolder, pdfsToBeProcessedCount, loopIndex);
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

const loopFolders = async () => {
    try {
        for (const [index, folder] of _foldersWithPath.entries()) {
            console.log(`Started processing ${folder}`)
            PDF_PROCESSING_COUNTER = 0;
            counter = 0
            await loopForExtraction(folder, destRootFolder, index + 1);
        }
        console.log(`FINAL_REPORT(extractPages): ${FINAL_REPORT.map(x => x + "\n")}`)
    }
    catch (err) {
        console.log(err)
    }
}
const srcRootFolder = 'D:\\eG-tr1-30';
//const srcRootFolder = 'E:\\MASTER_BACKUP';
const destRootFolder = "E:\\_catalogWork\\_reducedPdfs";
const _folders = ["Treasures"]
const _foldersWithPath = _folders.map(x => `${srcRootFolder}\\${x}`)

loopFolders()