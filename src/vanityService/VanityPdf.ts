import { PDF_FONT } from "../imgToPdf/utils/PdfDecoratorUtils";
import * as PdfLibUtils from '../imgToPdf/utils/PdfLibUtils';
import * as fsPromise from 'fs/promises';
import { getAllPdfsInFolders, mkDirIfDoesntExists } from "../imgToPdf/utils/Utils";
import { prepareDocument } from "../imgToPdf/utils/PdfUtils";
const path = require('path');
import { DEFAULT_FONT_SIZE, MAX_IMG_HEIGHT, MAX_IMG_WIDTH, formatIntroText, getImageDimensions, getProfileVanityInfo, profileVanityTextMap } from "./vanityConstants";
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

export const moveOrignalToSeparateFolder = async (pdfToVanitize: string, finalDumpGround: string) => {
    try {
        await mkDirIfDoesntExists(finalDumpGround);
        const newName = finalDumpGround + "\\" + path.parse(pdfToVanitize).name.trim() + path.parse(pdfToVanitize).ext
        console.log(`renaming ${pdfToVanitize} to ${newName}`)
        await fsPromise.rename(pdfToVanitize, newName);
    }
    catch (err) {
        console.log(`moveOrignalToSeparateFolder:err ${err}`)
    }
}
// _orig_dont

const createIntroPageWithImage = async (imagePath: string, pdfToVanitize: string,
    text: string[], fontSize: number,
    singlePage: boolean = false, nthPageToUseAsDimensions = 1) => {

    var imageFolderPath = path.dirname(pdfToVanitize);
    var _introPath = `${imageFolderPath}\\${_intros_dont}`;
    await mkDirIfDoesntExists(_introPath);

    const pdfToVanitizeNameWithoutExt = path.parse(pdfToVanitize).name.trim()
    const introPDfName = pdfToVanitizeNameWithoutExt.split(" ").join("-") + "-intro.pdf";

    const [width, height] = await PdfLibUtils.getPdfNthPageDimensionsUsingPdfLib(pdfToVanitize, nthPageToUseAsDimensions);
    const doc: PDFKit.PDFDocument = await prepareDocument(_introPath, introPDfName, { size: [width, height] });
    console.log(`imageFolderPath ${imageFolderPath} 
                pdfToVanitize ${pdfToVanitize},
                nthPageToUseAsDimensions: ${nthPageToUseAsDimensions} `)


    if (singlePage) {
        await addImageToIntroPageAsWholePage(doc, imagePath, width, height)
        addTextToIntroPdf(doc, text.join("\n\n"), width, height, fontSize, singlePage)
    }
    else {
        await addImageToIntroPage(doc, imagePath, width, height)
        for (let i = 0; i < text.length; i++) {
            addTextToIntroPdf(doc, text[i], width, height, fontSize, singlePage)
        }
    }

    doc.save()

    // finalize the PDF and end the stream
    doc.end();
    console.log(`returning ${_introPath}\\${introPDfName}`)

    return `${_introPath}\\${introPDfName}`
}

export const addImageToIntroPageAsWholePage = async (doc: any,
    pathToImg: string,
    pgWidth: number,
    pgHeight: number) => {
    const imageDims = await getImageDimensions(pathToImg);

    let img = doc.openImage(pathToImg);
    doc.addPage({ size: [pgWidth, pgHeight] });

    let _imgWidth = imageDims.width;
    let _imgHeight = imageDims.height;

    //Will go in the bottom left corner
    doc.image(img, 0, pgHeight - _imgHeight - doc.page.margins.bottom,
        {
            width: _imgWidth,
            height: _imgHeight
        })
}


export const addImageToIntroPage = async (doc: any, pathToImg: string, pgWidth: number, pgHeight: number) => {
    const imageDims = await getImageDimensions(pathToImg);
    console.log(`imageDims width :${imageDims.width},${imageDims.height}`);
    let img = doc.openImage(pathToImg);
    doc.addPage({ size: [pgWidth, pgHeight] });
    let _imgWidth = imageDims.width;
    let _imgHeight = imageDims.height;

    // Calculate scaling factor
    const widthRatio = pgWidth / _imgWidth;
    const heightRatio = pgHeight / _imgHeight;
    const scalingFactor = Math.min(widthRatio, heightRatio);

    // Apply scaling factor to image dimensions
    _imgWidth *= scalingFactor;
    _imgHeight *= scalingFactor;

    // Center the image on the page
    const xOffset = (pgWidth - _imgWidth) / 2;
    const yOffset = (pgHeight - _imgHeight) / 2;

    doc.image(img, xOffset, yOffset, {
        width: _imgWidth,
        height: _imgHeight
    });
}

export const addTextToIntroPdf = (doc: any, text: string, width: number,
    height: number, recommendedFontSize: number, singlePage: boolean = true) => {
    if (!singlePage) {
        doc.addPage({ size: [width, height] });
    }
    let oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0 //Dumb: Have to remove bottom margin in order to write into it
    const xCoordinate = doc.page.margins.left / 2
    const yCoordinate = doc.page.margins.top / 2;

    doc.font(PDF_FONT).fontSize(recommendedFontSize)
        .fillColor('black')
        .text(text, xCoordinate, yCoordinate)
    doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
}

const mergeVanityPdf = async (_introPdf: string, origPdf: string,
    finalDumpGround: string,
    suffix: string = "",
    pdfSuffix: string = "") => {
    var origFileName = path.basename(origPdf);
    var destDir = path.dirname(_introPdf);

    await mkDirIfDoesntExists(finalDumpGround);

    const pdfsForMerge = [];
    for (const _pdf of [origPdf, _introPdf]) {
        console.log(`_pdf: ${_pdf}`);
        const pdfContent = await fsPromise.readFile(_pdf);
        pdfsForMerge.push(pdfContent);
    }
    let _fileNameWithSuffix = origFileName.replace(".pdf", "");
    if (suffix.length > 0) {
        _fileNameWithSuffix = `${_fileNameWithSuffix} ${suffix?.trim()}`
    }

    if (pdfSuffix.length > 0) {
        _fileNameWithSuffix = `${_fileNameWithSuffix} ${pdfSuffix?.trim()}`
    }
    const finalPdfPath = `${finalDumpGround}\\${_fileNameWithSuffix}.pdf`
    await PdfLibUtils.mergePDFDocuments(pdfsForMerge, finalPdfPath)
    console.log(`${_introPdf}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(_introPdf));
    console.log(`dim::${finalPdfPath}`, await PdfLibUtils.getPdfFirstPageDimensionsUsingPdfLib(finalPdfPath));
}

const vanitizePdfForProfile = async (profile: string, suffix: string = "") => {
    try {
        const folder = getFolderInSrcRootForProfile(profile);
        const _pdfs = await getAllPdfsInFolders([folder]);
        const intros: string[] = []
        console.log(`vanitizePdfForProfile `);
        const [vanityIntro, imgFile, fontSize, singlePage, pdfSuffix, nthPageToUseAsDimensions] = getProfileVanityInfo(profile, folder);
        console.log(`vanitizePdfForProfile ${folder}, ${_pdfs.length} fontSize:${fontSize} imgFile:${imgFile}
            nthPageToUseAsDimensions: ${nthPageToUseAsDimensions} singlePage: ${singlePage}`);

        for (let i = 0; i < _pdfs.length; i++) {
            console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfNthPageDimensionsUsingPdfLib(_pdfs[i], nthPageToUseAsDimensions))
            intros.push(await createIntroPageWithImage(imgFile, _pdfs[i],
                vanityIntro.map((text: string) => formatIntroText(text)), fontSize, singlePage, nthPageToUseAsDimensions));
        }

        for (let i = 0; i < _pdfs.length; i++) {
            console.log(`creating vanity for: ${_pdfs[i]}`, await PdfLibUtils.getPdfNthPageDimensionsUsingPdfLib(_pdfs[i], nthPageToUseAsDimensions))
            await mergeVanityPdf(intros[i], _pdfs[i], `${folder}\\${_vanitized}`, suffix, pdfSuffix)
            moveOrignalToSeparateFolder(_pdfs[i], `${folder}\\${_orig_dont}`)
        }
        return {
            "status": "success",
            success: true,
            "message": `vanity pdfs generated for profile ${profile} with folder ${folder} with pdf count- ${_pdfs.length} pdfs.`
        }
    }
    catch (err) {
        console.error(`vanitizePdfForProfile:err ${err}`)
        return {
            "status": `Failed for profile: ${profile}. Does profileVanityTextMap has the profile?`,
            success: false,
            "message": err?.message || "vanitizePdfForProfile: Unknown error"
        }
    }
}

export const vanitizePdfForProfiles = async (profileAsCSV: string, suffix: string = "") => {
    const responseList = []
    const profiles = profileAsCSV.split(",");
    for (let i = 0; i < profiles.length; i++) {
        console.log(`vanitizePdfForProfiles(${i}): ${profiles[i]}`);
        const _res = await vanitizePdfForProfile(profiles[i]?.trim(), suffix);
        responseList.push(_res);
    }
    console.log(`vanitizePdfForProfiles:responseList ${responseList}`);
    return responseList;
}
//pnpm run vanity