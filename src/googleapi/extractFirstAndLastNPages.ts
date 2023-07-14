import { PDFDocument, PDFPage } from 'pdf-lib';
import fs from 'fs';
import * as _ from 'lodash';
import Path from 'path'
import { createFolderIfNotExists, getAllPDFFiles } from '../imgToPdf/utils/FileUtils';
import { initForm } from 'pdfkit';
const fsPromises = require('fs').promises;


const firstNPages = 10
const lastNPages = 10

async function createPartialPdf(inputPath: string, outputPath: string): Promise<number> {
    const existingPdfBytes = await fsPromises.readFile(inputPath)

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    let range: number[] = []
    const pdfPageCount = pdfDoc.getPages().length

    console.log(`Pdf No. ${++counter} pdfPageCount ${pdfPageCount}`);

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

    const filename = Path.parse(inputPath).name
    const newOutputFileName = padNumbersWithZeros(pdfPageCount)
    fs.writeFile(`${outputPath}//${filename}_${newOutputFileName}.pdf`, newPdfBytes, (err) => {
        if (err)
            console.log(err);
        else {
            console.log(` ${newOutputFileName} File written successfully\n`);
        }
    });
    return pdfPageCount
}

const inputPathWithName = 'C:\\Users\\chetan\\Documents\\_testPDF\\pdfs\\t2.pdf';
let counter = 0;
export const loopForExtraction = async () => {
    const outputPath = 'C:\\tmp\\Treasures7';
    const rootFolder = "D:\\eG-tr1-30\\Treasures6\\amit\\malhotra"
    const allPdfs = getAllPDFFiles(rootFolder)
    createFolderIfNotExists(outputPath)
    for (const pdf of allPdfs) {
        try {
            await createPartialPdf(pdf, outputPath)
        }
        catch (error) {
            console.error('Error creating PDF:', error);
        }
    }
    console.log(`allPdfs ${allPdfs.length} ${allPdfs.length === 277} allPdfs[0] ${allPdfs[0]}`);
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
loopForExtraction()