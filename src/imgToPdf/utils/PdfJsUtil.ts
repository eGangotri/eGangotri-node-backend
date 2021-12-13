//const pdfjsLib = require('pdfjs-dist');


//const pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

export async function pdfPageCountUsingPdfJs(pdfPath:string){
   const doc = await pdfjsLib.getDocument(pdfPath)
   var numPages = doc.numPages;
   return numPages
}
