import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */

export async function getPdfPageCount(pdf:string){
    const pdfDoc = await PDFDocument.load(fs.readFileSync(pdf));
    return pdfDoc.getPages().length
}
