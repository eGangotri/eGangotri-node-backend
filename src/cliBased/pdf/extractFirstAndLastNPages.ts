import { PDFDocument, PDFPage } from 'pdf-lib';
import fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { getAllPDFFiles } from '../../utils/FileStatsUtils';
import { createFolderIfNotExists } from '../../utils/FileUtils';


const fsPromises = require('fs').promises;

let FINAL_REPORT: string[] = [];
let PDF_PROCESSING_COUNTER = 0;
export const DEFAULT_PDF_PAGE_EXTRACTION_COUNT:number = 10;

async function createPartialPdf(inputPath: string, 
    outputPath: string, 
    pdfsToBeProcessedCount: number,
     index: string,
     firstNPages: number = DEFAULT_PDF_PAGE_EXTRACTION_COUNT,
     lastNPages: number = DEFAULT_PDF_PAGE_EXTRACTION_COUNT
    ): Promise<number> {
    const existingPdfBytes = await fsPromises.readFile(inputPath)

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    let range: number[] = []
    const pdfPageCount = pdfDoc.getPages().length

    console.log(`Pdf Extraction: Folder # (${parseInt(index)+1}) Pdf No. ${++counter}/${pdfsToBeProcessedCount}
         pdfPageCount ${pdfPageCount}
         extracting: ${firstNPages} and ${lastNPages} pages
         `);
    if (pdfPageCount > (Number(firstNPages) + Number(lastNPages))) {
        range = _.range(0, firstNPages).concat(_.range(pdfPageCount - lastNPages, pdfPageCount));
    }
    else {
        range = _.range(0, pdfPageCount);
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

export const loopFolderForExtraction = async (rootFolder: string,
     outputRoot: string, 
     loopIndex: string,
     firstNPages: number,
     lastNPages: number) => {
    const allPdfs = await getAllPDFFiles(rootFolder)
    const pdfsToBeProcessedCount = allPdfs.length;
    const outputPath = `${outputRoot}\\${path.parse(rootFolder).name} (${pdfsToBeProcessedCount})`;
    console.log(`rootFolder ${rootFolder} ${outputRoot} ${loopIndex}`);
    createFolderIfNotExists(outputPath)
    let errorCount = 0;
    for (const [index, pdf] of allPdfs.entries()) {
        const _path = path.parse(pdf.absPath);
        const subDir = _path.dir.replace(rootFolder, '')
        let _subFolder = `${outputPath}\\${subDir}`
        createFolderIfNotExists(_subFolder);
        try {
            await createPartialPdf(pdf.absPath, _subFolder, pdfsToBeProcessedCount, loopIndex,firstNPages, lastNPages);
            PDF_PROCESSING_COUNTER++;
        }
        catch (error) {
            console.error('Error creating PDF:', error);
            errorCount++;
            //throw new Error(`Error creating PDF: ${error}`)
            continue;
        }
    }

    const consoleLog: string =
        `\nFolder # (${loopIndex}).${path.parse(rootFolder).name} 
        PDF Count ${pdfsToBeProcessedCount} == PDF_PROCESSING_COUNTER ${PDF_PROCESSING_COUNTER} 
        Match ${pdfsToBeProcessedCount === PDF_PROCESSING_COUNTER}`

    FINAL_REPORT.push(consoleLog);
    console.log(consoleLog);
    return {
        outputPath,
        pdfsToBeProcessedCount,
        match: pdfsToBeProcessedCount === PDF_PROCESSING_COUNTER,
        errorCount
    }
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

export const extractFirstAndLastNPages = async (_srcFoldersWithPath: string[],
    destRootFolder: string,
    firstNPages: number,
    lastNPages: number) => {
    
    let errors = [];
    FINAL_REPORT = []
    const dumpFolder = []
    const _report = []
    for (const [index, folder] of _srcFoldersWithPath.entries()) {
        console.log(`extractFirstAndLastNPages:Started processing
             ${folder} to
             ${destRootFolder}
            for-extracting ${firstNPages} pages f ${firstNPages }-${lastNPages}`)
        PDF_PROCESSING_COUNTER = 0;
        counter = 0
        try {
            const _result = await loopFolderForExtraction(folder, destRootFolder, index.toString(), firstNPages, lastNPages);
            dumpFolder.push(_result.outputPath);
            _report.push(_result)
        }
        catch (err) {
            errors.push(`Error in processing ${folder} ${err}`)
            FINAL_REPORT.push(`**Folder # (${index + 1}/${_srcFoldersWithPath.length}).${folder}`)
            console.log(`Error in processing ${folder} ${err}`)
        }
    }
    console.log(`FINAL_REPORT(extractPages): ${FINAL_REPORT.map(x => x + "\n")}`)
    return {
        success: `${errors.length === 0 ? `Success(All ${_srcFoldersWithPath.length})` : `${errors.length} of ${_srcFoldersWithPath.length} failed`}`,
        "Sources": ` ${_srcFoldersWithPath}`,
        "Dest": destRootFolder,
        pageRange: `${(firstNPages===lastNPages)?firstNPages:`${firstNPages}-${lastNPages}`}`,
        report: FINAL_REPORT,
        dumpFolder: dumpFolder.join(","),
        failures: errors,
        _report
    }
}

// const destRootFolder = "C:\\_catalogWork\\_reducedPdfs";

// const srcRootFolder = 'H:\\eG-tr1-30';
// const _folders = [20]
// const _srcFoldersWithPath = _folders.map(x => `${srcRootFolder}\\Treasures${x}`)

//extractFistsAndLastPages(_srcFoldersWithPath, destRootFolder)
//pnpm run extractFirstAndLastNPages