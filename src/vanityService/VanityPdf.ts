import { PDF_FONT } from "../imgToPdf/utils/PdfDecoratorUtils";
import * as PdfLibUtils from '../imgToPdf/utils/PdfLibUtils';
import * as fs from 'fs';
import { getAllPdfsInFolders, mkDirIfDoesntExists } from "../imgToPdf/utils/Utils";
import { prepareDocument } from "../imgToPdf/utils/PdfUtils";
const path = require('path');
import { DEFAULT_FONT_SIZE, MAX_IMG_WIDTH, formatIntroText, profileVanityTextMap } from "./vanityConstants";
import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { font } from "pdfkit";


/**
 * This was casuing race issues.
 * where intro pdfs were not ready while merging.
 * so better to use independently
 * @param imagePath 
 * @param pdfToVanitize 
 * @param text 
 * @param finalDumpGround 
 */

const _intros_dont = "_intros_dont"
const _orig_dont = "_orig_dont"
const _vanitized = "_vanitized"

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

export const moveOrignalToSeparateFolder = async (pdfToVanitize: string, finalDumpGround: string) => {
    try {
        await mkDirIfDoesntExists(finalDumpGround);
        const newName = finalDumpGround + "\\" + path.parse(pdfToVanitize).name.trim() + path.parse(pdfToVanitize).ext
        console.log(`renaming ${pdfToVanitize} to ${newName}`)
        fs.renameSync(pdfToVanitize, newName);
    }
    catch (err) {
        console.log(`createVanityPdf:err ${err}`)
    }
}
// _orig_dont
const createIntroPageWithImage = async (imagePath: string, pdfToVanitize: string, text: string, fontSize: number) => {
    var imageFolderPath = path.dirname(imagePath);
    var _introPath = `${imageFolderPath}\\${_intros_dont}`;
    await mkDirIfDoesntExists(_introPath);

    const pdfToVanitizeNameWithoutExt = path.parse(pdfToVanitize).name.trim()
    const introPDfName = pdfToVanitizeNameWithoutExt.split(" ").join("-") + "-intro.pdf";

    const doc: PDFKit.PDFDocument = await prepareDocument(_introPath, introPDfName);
    console.log(`imageFolderPath ${imageFolderPath} 
                pdfToVanitize ${pdfToVanitize} `)

    const [width, height] = await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(pdfToVanitize);

    await addImageToFirstPage(doc, imagePath, width, height)
    addTextToSecondPage(doc, text, width, height,fontSize)
    doc.save()

    // finalize the PDF and end the stream
    doc.end();
    console.log(`returning ${_introPath}\\${introPDfName}`)

    return `${_introPath}\\${introPDfName}`
}

export const addImageToFirstPage = async (doc: any, pathToImg: string, imgWidth: number, height: number) => {

    let img = doc.openImage(pathToImg);
    doc.addPage({ size: [imgWidth, height] });
    if (imgWidth > MAX_IMG_WIDTH) {
        doc.image(img, (imgWidth - MAX_IMG_WIDTH) / 2, 0,
            {
                width: MAX_IMG_WIDTH,
                height: doc.page.height
            })
    }
    else {
        doc.image(img, 0, 0,
            {
                width: imgWidth,
                height: doc.page.height
            })
    }
}

export const addTextToSecondPage = (doc: any, text: string, width: number, height: number, fontSize:number) => {
    doc.addPage({ size: [width, height] });

    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const xCoordinate = doc.page.margins.left / 2
    const yCoordinate = doc.page.margins.top / 2;
    doc.font(PDF_FONT).fontSize(fontSize)
        .fillColor('black')
        .text(text, xCoordinate, yCoordinate)
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

const mergeVanityPdf = async (_introPdf: string, origPdf: string, finalDumpGround: string) => {
    var origFileName = path.basename(origPdf);
    var destDir = path.dirname(_introPdf);

    await mkDirIfDoesntExists(finalDumpGround);

    const pdfsForMerge = [origPdf, _introPdf].map((_pdf) => {
        console.log(`_pdf: ${_pdf}`)
        return fs.readFileSync(_pdf)
    });
    const finalPdfPath = `${finalDumpGround}\\${origFileName}`
    await PdfLibUtils.mergePDFDocuments(pdfsForMerge, finalPdfPath)
    console.log(`${_introPdf}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_introPdf));
    console.log(`dim::${finalPdfPath}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(finalPdfPath));
}

export const vanitizePdfForProfile = async (profile: string) => {
    try {
        const folder = getFolderInSrcRootForProfile(profile);
        const _pdfs = await getAllPdfsInFolders([folder]);
        const intros: string[] = []
        console.log(`vanitizePdfForProfile ${folder}, ${_pdfs.length}`)
        for (let i = 0; i < _pdfs.length; i++) {
            console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_pdfs[i]))
            const vanityIntro = profileVanityTextMap[`${profile}`].text;
            const imgFile = folder + "\\" + profileVanityTextMap[`${profile}`].imgFile;
            const fontSize = profileVanityTextMap[`${profile}`]?.fontSize || DEFAULT_FONT_SIZE;
            intros.push(await createIntroPageWithImage(imgFile, _pdfs[i], formatIntroText(vanityIntro)), fontSize);
        }

        for (let i = 0; i < _pdfs.length; i++) {
            console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_pdfs[i]))
            await mergeVanityPdf(intros[i], _pdfs[i], `${folder}\\${_vanitized}`)
            moveOrignalToSeparateFolder(_pdfs[i], `${folder}\\${_orig_dont}`)
        }
        return {
            "status": "success",
            "message": `vanity pdfs generated for profile ${profile} with folder ${folder} with pdf count- ${_pdfs.length} pdfs.`
        }
    }
    catch (err) {
        console.error(`vanitizePdfForProfile:err ${err}`)
        return {
            "status": "failed",
            "message": err.message
        }
    }
}
//yarn run vanity 