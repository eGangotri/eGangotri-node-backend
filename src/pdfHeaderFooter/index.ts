const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function addHeader(headerText: string, srcPdfPath: string, destPath: string = "") {
    await addHeaderAndFooterToPDF("", headerText, srcPdfPath, destPath);
}
async function addFooter(footerText: string, srcPdfPath: string, destPath: string = "") {
    await addHeaderAndFooterToPDF("", footerText, srcPdfPath, destPath);
}

export async function addHeaderAndFooterToPDF(headerText: string, footerText: string, srcPdfPath: string, destPath: string = "") {

    // Load the existing PDF
    const existingPdfBytes = fs.readFileSync(srcPdfPath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed the Helvetica font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get the pages of the document
    const pages = pdfDoc.getPages();

    // Define the text to be added to the footer and header

    // Define the color of the text
    const textColor = rgb(0, 0, 0);

    // Add the footer and header to each page
    for (const page of pages) {
        const { width, height } = page.getSize();
        const textSize = 12;

        // Calculate text width
        const footerTextWidth = helveticaFont.widthOfTextAtSize(footerText, textSize);
        const headerTextWidth = helveticaFont.widthOfTextAtSize(headerText, textSize);

        // Calculate x position for centered text
        const footerTextX = (width - footerTextWidth) / 2;
        const headerTextX = (width - headerTextWidth) / 2;

        // Define y position for footer and header
        const footerTextY = 50; // position from the bottom of the page
        const headerTextY = height - 50; // position from the top of the page

        if (headerText.trim().length > 0) {
            page.drawText(headerText, {
                x: headerTextX,
                y: headerTextY,
                size: textSize,
                font: helveticaFont,
                color: textColor,
            });
        }

        if (footerText.trim().length > 0) {
            // Draw the footer and header
            page.drawText(footerText, {
                x: footerTextX,
                y: footerTextY,
                size: textSize,
                font: helveticaFont,
                color: textColor,
            });
        }
    }
    const pdfBytes = await pdfDoc.save();
    if (destPath === "") {
        destPath = srcPdfPath;
    }
    fs.writeFileSync(destPath, pdfBytes);
}

const headerText = "This is the header text.";
const footerText = "This is the footer text.";


const pdfContainingFolder = "C:\\Users\\chetan\\Documents\\_testPDF";
const _srcPdfPath = `${pdfContainingFolder}\\output-t1-2-reduced-manually.pdf`
const _destPdfPath = _srcPdfPath.replace(".pdf", "-withFooter2.pdf");

//addHeaderAndFooterToPDF(" ", footerText, _srcPdfPath, _destPdfPath);