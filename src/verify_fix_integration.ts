
import * as fs from 'fs';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { prepareDocument } from './imgToPdf/utils/PdfUtils';
import * as path from 'path';

async function run() {
    const outputDir = '.';
    const pdfName = 'integration_fix_test.pdf';
    const pdfPath = path.join(outputDir, pdfName);
    const customWidth = 300;
    const customHeight = 300;

    // Use the actual codebase function with the fix
    // We pass the size option, which should be forwarded to PDFKit
    const doc = await prepareDocument(outputDir, pdfName, { size: [customWidth, customHeight] });

    // Add first page (should inherit size from constructor)
    doc.addPage();

    // Add text that will definitely overflow
    const longText = "This is a long text that should overflow to the next page. ".repeat(500);

    doc.fontSize(12).text(longText);
    doc.end();

    // Wait for file to be written (prepareDocument handles the stream, but we need to wait for it to finish)
    // prepareDocument returns the doc, but the stream is internal. 
    // However, doc.end() triggers the write. We'll wait a bit to be safe or check file size.

    // A better way is to wait for the 'finish' event on the stream, but prepareDocument doesn't expose the stream directly.
    // We'll wait for a short duration.
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Created integration fix test PDF.');

    // Verify dimensions with pdf-lib
    const checkDoc = await PDFLibDocument.load(fs.readFileSync(pdfPath));
    const pageCount = checkDoc.getPageCount();
    console.log(`Page count: ${pageCount}`);

    if (pageCount < 2) {
        console.log('ERROR: Text did not overflow. Increase text length.');
        return;
    }

    const page1 = checkDoc.getPage(0);
    const page2 = checkDoc.getPage(1);

    const p1Size = page1.getSize();
    const p2Size = page2.getSize();

    console.log(`Page 1 Size: ${p1Size.width}x${p1Size.height}`);
    console.log(`Page 2 Size: ${p2Size.width}x${p2Size.height}`);

    if (Math.abs(p2Size.width - customWidth) < 1 && Math.abs(p2Size.height - customHeight) < 1) {
        console.log('PASS: Page 2 has correct custom dimensions.');
    } else {
        console.log('FAIL: Page 2 has incorrect dimensions.');
    }

    // Cleanup
    // fs.unlinkSync(pdfPath);
}

run().catch(console.error);
