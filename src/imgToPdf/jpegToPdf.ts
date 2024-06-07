import { PDFDocument, rgb } from 'pdf-lib';
import { readdir, readFile, writeFile } from 'fs-extra';
import { join } from 'path';

async function convertJpegsToPdf(inputFolder: string, outputPdfPath: string) {
    const pdfDoc = await PDFDocument.create();
    const jpegFiles = (await readdir(inputFolder)).filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg'));

    for (const jpegFile of jpegFiles) {
        const jpegPath = join(inputFolder, jpegFile);
        const jpegImageBytes = await readFile(jpegPath);
        const jpegImage = await pdfDoc.embedJpg(jpegImageBytes);
        const page = pdfDoc.addPage([jpegImage.width, jpegImage.height]);
        page.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: jpegImage.width,
            height: jpegImage.height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    await writeFile(outputPdfPath, pdfBytes);

    console.log(`PDF created at ${outputPdfPath}`);
}

// Example usage
const inputFolder = './path/to/jpeg/folder';
const outputPdfPath = './output.pdf';

convertJpegsToPdf(inputFolder, outputPdfPath)
    .then(() => console.log('Conversion complete'))
    .catch(error => console.error('Error during conversion:', error));
