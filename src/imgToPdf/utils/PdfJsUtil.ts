//const pdfjsLib = require('pdfjs-dist');

import { getFilzeSize } from "./PdfLibUtils";
import { PDF_SIZE_LIMITATIONS } from "./PdfUtil";
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

export async function pdfPageCountUsingPdfJs(pdfPath: string) {
   if (getFilzeSize(pdfPath) <= PDF_SIZE_LIMITATIONS) {
      const doc = await pdfjsLib.getDocument(pdfPath)
      var numPages = doc.numPages;
      return numPages
   }
   return -1
}
