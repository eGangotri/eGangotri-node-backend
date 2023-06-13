import { PDF_FONT } from "../imgToPdf/utils/PdfDecoratorUtils";
import * as PdfLibUtils from '../imgToPdf/utils/PdfLibUtils';
import * as fs from 'fs';
import { getAllPdfsInFolders, mkDirIfDoesntExists } from "../imgToPdf/utils/Utils";
import { prepareDocument } from "../imgToPdf/utils/PdfUtils";
const path = require('path');
import PDFKit from 'pdfkit';

/** This should be dynamic based on the Width/height */
const FONT_SIZE = 16
/**
 * This was casuing race issues.
 * where intro pdfs were not ready while merging.
 * so better to use independently
 * @param imagePath 
 * @param pdfToVanitize 
 * @param text 
 * @param finalDumpGround 
 */

export const createVanityPdf = async (imagePath: string, pdfToVanitize: string, text: string, finalDumpGround: string) => {
    try {
        const introPdf = await createIntroPageWithImage(imagePath, pdfToVanitize, text);
        console.log(`merge vanity pdf ${introPdf} pdfName ${pdfToVanitize} `);
        console.log(`dim:${introPdf}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(introPdf))
        await mergeVanityPdf(introPdf, pdfToVanitize, finalDumpGround)
    }
    catch (err) {
        console.log(`createVanityPdf:err ${err}`)
    }
}

const createIntroPageWithImage = async (imagePath: string, pdfToVanitize: string, text: string) => {
    var imageFolderPath = path.dirname(imagePath);
    var _introPath = `${imageFolderPath}\\_intros`;
    await mkDirIfDoesntExists(_introPath);

    const pdfToVanitizeNameWithoutExt = path.parse(pdfToVanitize).name.trim()
    const introPDfName = pdfToVanitizeNameWithoutExt.split(" ").join("-") + "-intro.pdf";

    const doc: PDFKit.PDFDocument = await prepareDocument(_introPath, introPDfName);
    console.log(`imageFolderPath ${imageFolderPath} 
                pdfToVanitize ${pdfToVanitize} `)

    const [width, height] = await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(pdfToVanitize);

    await addImageToFirstPage(doc, imagePath, width, height)
    addTextToSecondPage(doc, text, width, height)
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
    console.log(`returning ${_introPath}\\${introPDfName}`)

    return `${_introPath}\\${introPDfName}`
}

export const addImageToFirstPage = async (doc: any, pathToImg: string, width: number, height: number) => {

    let img = doc.openImage(pathToImg);
    doc.addPage({ size: [width, height] });
    doc.image(img, 0, 0,
        {
            width: doc.page.width,
            height: doc.page.height
        })
}

export const addTextToSecondPage = (doc: any, text: string, width: number, height: number) => {
    doc.addPage({ size: [width, height] });

    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height
    const xCoordinate = doc.page.margins.left / 2
    const yCoordinate = doc.page.margins.top / 2
    doc.font(PDF_FONT).fontSize(FONT_SIZE)
        .fillColor('black')
        .text(text, xCoordinate, yCoordinate)
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

const text = `This PDF you are browsing is in a series of several scanned documents containing 
the collation of all research material of Prof. Kul Bhushan Mohtra ji.Mohtra ji is currently the State 
Incharge Library and Documentation Department, J&K BJP Headquarters, Nanaji 
Deshmukh Library..This material was gathered while he was working on his multiple books on J&K History.
All this rare material is now offered to the Community freely.<br>

CV:<br>
Kul Bhushan Mohtra was born on 9th Sep, 1957 in a village Amuwala in Kathua district.<br>
Matric from BOSE, Jammu and Adeeb from AMU. Has been awarded Honorary Professor by School of Liberal Art & Languages, Shobhit University, Gangoh, Distt. Saharanpur, U.P.<br>
Director General, Raja Ram Mohan Roy Library Foundation nominated him as his nominee in the Committee for purchasing of Books for UT Jammu & Kashmir. Incharge of Nanaji Deshmukh Library & Documentation Department at BJP state HQ in J&K.<br>
Actively engaged in political, social, charitable and religious activities. Always striving to serve the poor and downtrodden of the society.<br>
Main works-<br>
A saga of Sacrifices: Praja Parishad Movement in J&K<br>
100 Documents: A reference book J&K, Mission Accomplished<br>
A Compendium of Icons of Jammu & Kashmir & our Inspiration (English)<br>
Jammu Kashmir ki Sangarsh Gatha (Hindi)<br><br><br>
Scanning and upload by eGangotri Foundation.<br>`.replace(/\n/g, '').replace(/<br>/g, '\n\n');


const mergeVanityPdf = async (_introPdf: string, origPdf: string, finalDumpGround: string) => {
    var origFileName = path.basename(origPdf);
    var destDir = path.dirname(_introPdf);

    await mkDirIfDoesntExists(finalDumpGround);

    const pdfsForMerge = [_introPdf, origPdf].map((_pdf) => {
        console.log(`_pdf: ${_pdf}`)
        return fs.readFileSync(_pdf)
    });
    const finalPdfPath = `${finalDumpGround}\\${origFileName}`
    await PdfLibUtils.mergePDFDocuments(pdfsForMerge, finalPdfPath)
    console.log(`${_introPdf}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_introPdf));
    console.log(`dim::${finalPdfPath}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(finalPdfPath));
}

(async () => {
    const _root = "D:\\_Treasures59\\_data\\bjpjammu"
    const _pdfRoot = `${_root}\\MohtraArchives`
    const imgFile = `${_root}\\mohtra.jpg`

    const _pdfs = await getAllPdfsInFolders([_pdfRoot]);
    const intros: string[] = []
    for (let i = 0; i < _pdfs.length; i++) {
        console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_pdfs[i]))
        intros.push(await createIntroPageWithImage(imgFile, _pdfs[i], text));
    }
    for (let i = 0; i < _pdfs.length; i++) {
        console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_pdfs[i]))
        await mergeVanityPdf(intros[i], _pdfs[i], `${_pdfRoot}\\1`)
    }
})();
