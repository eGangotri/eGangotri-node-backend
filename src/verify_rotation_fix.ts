
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { getPdfNthPageDimensionsUsingPdfLib } from './imgToPdf/utils/PdfLibUtils';
import * as fs from 'fs';

async function run() {
    const pdfPath = 'temp_rotation_test.pdf';

    // Create a test PDF with known dimensions and rotation
    const doc = await PDFDocument.create();

    // Page 1: Landscape (800x600), No rotation
    const page1 = doc.addPage([800, 600]);

    // Page 2: Portrait (600x800), Rotated 90 degrees (Visual Landscape)
    const page2 = doc.addPage([600, 800]);
    page2.setRotation(degrees(90));

    const pdfBytes = await doc.save();
    fs.writeFileSync(pdfPath, pdfBytes);

    console.log('Created test PDF.');

    // Test Page 1
    const dim1 = await getPdfNthPageDimensionsUsingPdfLib(pdfPath, 1);
    console.log(`Page 1 (Physical Landscape 800x600, Rot 0): [${dim1[0]}, ${dim1[1]}]`);
    if (dim1[0] === 800 && dim1[1] === 600) {
        console.log('PASS: Page 1 dimensions correct.');
    } else {
        console.log('FAIL: Page 1 dimensions incorrect.');
    }

    // Test Page 2
    const dim2 = await getPdfNthPageDimensionsUsingPdfLib(pdfPath, 2);
    console.log(`Page 2 (Physical Portrait 600x800, Rot 90 -> Visual Landscape): [${dim2[0]}, ${dim2[1]}]`);
    // Should be swapped to 800x600 because of rotation
    if (dim2[0] === 800 && dim2[1] === 600) {
        console.log('PASS: Page 2 dimensions correct (swapped).');
    } else {
        console.log('FAIL: Page 2 dimensions incorrect.');
    }

    // Cleanup
    fs.unlinkSync(pdfPath);
}

run().catch(console.error);
