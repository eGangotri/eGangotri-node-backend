import { PDFDocument } from 'pdf-lib'
import * as fs from 'fs';

/**
 * Uses https://pdf-lib.js.org/#examples
 * https://www.npmjs.com/package/pdf-lib
 */

export async function getPdfPageCount(pdfPath:string){
    var stats = fs.statSync(pdfPath)
    var fileSizeInBytes = stats.size;
    var fileSizeInGB = fileSizeInBytes / (1024*1024*1024);
        if(fileSizeInGB<=2){
            const pdfDoc = await PDFDocument.load(fs.readFileSync(pdfPath));
            return pdfDoc.getPages().length
        }
        else return -1
}
