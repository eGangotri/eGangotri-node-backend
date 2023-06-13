import { PDF_FONT } from "../imgToPdf/utils/PdfDecoratorUtils";
import { calculateFontSize, prepareDocument } from "../imgToPdf/utils/PdfUtils";
const PDFDocument = require('pdfkit');
import * as PdfLibUtils from '../imgToPdf/utils/PdfLibUtils';
import * as fs from 'fs';
const path = require('path');


export const createVanityPdf = async (imagePath: string,
    pdfToVanitize: string, text: string) => {

    const introPdf = await createIntroPageWithImage(imagePath,pdfToVanitize, text);
    console.log(`merge vanity pdf ${introPdf} pdfName ${pdfToVanitize} `)

    mergeVanityPdf(introPdf, pdfToVanitize)
}

const createIntroPageWithImage = async (imagePath: string,
    pdfToVanitize: string, text: string) => {
    var imageFolderPath = path.dirname(imagePath);

    const filenameWithoutExt = path.parse(pdfToVanitize).name
    const introFileName = filenameWithoutExt + "-intro.pdf";

    const doc = await prepareDocument(imageFolderPath, introFileName);
    console.log(`pathToImg ${imageFolderPath} pdfName ${pdfToVanitize} `)

    const [width, height] = await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(pdfToVanitize);

    addImageToFirstPage(doc, imagePath, width, height)
    addTextToSecondPage(doc, text, width, height)
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
    return `${imageFolderPath}\\${introFileName}`
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

export function addTextToSecondPage(doc: any, text: string, width: number, height: number) {
    doc.addPage({ size: [width, height] });

    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height
    const xCoordinate = doc.page.margins.left / 2
    const yCoordinate = doc.page.margins.top / 2
    doc.font(PDF_FONT).fontSize(10)
        .fillColor('black')
        .text(text, xCoordinate, yCoordinate)
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

const text = `This PDF you are browsing is in a series of several scanned documents containing 
the collation of all research material of Prof. Kul Bhushan Mohtra ji.Mohtra ji is currently the State 
Incharge Library and Documentation Department, J&K BJP Headquarters, Nanaji 
Deshmukh Library..This material was gathered while he was working on his multiple books on J&K History.
All this rare material is now offered to the Community freely..

CV:..
Kul Bhushan Mohtra was born on 9th Sep, 1957 in a village Amuwala in Kathua district..
Matric from BOSE, Jammu and Adeeb from AMU. Has been awarded Honorary Professor by School of Liberal Art & Languages, Shobhit University, Gangoh, Distt. Saharanpur, U.P..
Director General, Raja Ram Mohan Roy Library Foundation nominated him as his nominee in the Committee for purchasing of Books for UT Jammu & Kashmir. Incharge of Nanaji Deshmukh Library & Documentation Department at BJP state HQ in J&K..
Actively engaged in political, social, charitable and religious activities. Always striving to serve the poor and downtrodden of the society.
Main works-..
A saga of Sacrifices: Praja Parishad Movement in J&K..
100 Documents: A reference book J&K, Mission Accomplished..
A Compendium of Icons of Jammu & Kashmir & our Inspiration (English)..
Jammu Kashmir ki Sangarsh Gatha (Hindi)..
Scanning and upload by eGangotri Foundation.Prof`.replace(/\n/g, '').replace(/\.\./g, '\n\n');


const mergeVanityPdf = async (_introPdf: string, origPdf: string) => {
    var origFileName = path.basename(origPdf);
    var destDir = path.dirname(_introPdf);

    const pdfsForMerge = [_introPdf, origPdf].map((x) => {
        console.log(`x: ${x}`)
        return fs.readFileSync(x)
    });
    await PdfLibUtils.mergePDFDocuments(pdfsForMerge, `${destDir}\\${origFileName}`)
    console.log(`${_introPdf}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_introPdf));
    console.log(`dim::${destDir}\\${origFileName}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(`${destDir}\\${origFileName}`));

}

const func = async () => {
    const pdfRoot = "C:\\Users\\chetan\\Documents\\_testPDF\\\pdfs\\"
    const file1 = `${pdfRoot}\\16-04-2023 anaqntnag.pdf`;
    const file2 = `${pdfRoot}\\_Up Gyan Amrit.pdf`;
    const file3 = `${pdfRoot}\\Bhrahat Shabdendu Shekhar II - Nagesh Bhatt.pdf`;
    const file4 = `${pdfRoot}\\Definitional Dictionary of Archaeology_compressed.pdf`;
    const file5 = `${pdfRoot}\\Bhaskar Prakash.pdf`;

    console.log(`dim:${file1}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(file1))
    console.log(`dim:${file2}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(file2))
    console.log(`dim:${file3}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(file3))
    console.log(`dim:${file4}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(file4))
    console.log(`dim:${file5}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(file5))


    const imgFile = "C:\\Users\\chetan\\Documents\\_testPDF\\introPdfDimAdjustedFolder\\mohtra.jpg";
    await createVanityPdf(imgFile, file1, text);
}

func();