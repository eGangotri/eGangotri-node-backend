import { PDFDocument, rgb } from 'pdf-lib';
import { readdir, readFile, writeFile } from 'fs-extra';
import path, { join } from 'path';
import { generateExcel } from 'archiveDotOrg/utils';

export async function convertJpgsToPdf(inputFolder: string, outputFolder = "") {
    try {
        const pdfDoc = await PDFDocument.create();
        const jpegFiles = (await readdir(inputFolder)).filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg')
            || file.endsWith('.JPEG') || file.endsWith('.JPG'));
        const generatedPdf = outputFolder?.length > 0 ? outputFolder : inputFolder + path.sep + path.basename(inputFolder) + '.pdf';
        let counter = 0;
        if (jpegFiles.length === 0) {
            return {
                error: 'No JPEG files found in the input folder',
                success: false
            };
        }
        for (const jpegFile of jpegFiles) {
            const jpegPath = join(inputFolder, jpegFile);
            const jpegImageBytes = await readFile(jpegPath);
            const jpegImage = await pdfDoc.embedJpg(jpegImageBytes);
            const page = pdfDoc.addPage([jpegImage.width, jpegImage.height]);
            console.log(`Adding file#${++counter} ${jpegFile} to PDF...`)
            page.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: jpegImage.width,
                height: jpegImage.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        await writeFile(generatedPdf, pdfBytes);

        console.log(`PDF created at ${generatedPdf}`);
        const pageCount = pdfDoc.getPageCount();
        return {
            success: true,
            src: inputFolder,
            jpgCount: jpegFiles.length,
            generatePdfPageCount: pageCount,
            jpgPdfPAgeCountEqual: jpegFiles.length === pageCount,
            msg: `${generatedPdf} created from ${inputFolder}.`,
            generatedPdf
        }
    }

    catch (error) {
        console.error('Error during conversion:', error);
        return {
            error,
            success: false
        };
    }
}
// Example usage
const inputFolder = './path/to/jpeg/folder';

convertJpgsToPdf(inputFolder)
    .then(() => console.log('Conversion complete'))
    .catch(error => console.error('Error during conversion:', error));
