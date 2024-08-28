import * as fs from 'fs';
import archiver from 'archiver';

function zipFiles(filePaths: string[], outputZipPath: string): void {
    const output = fs.createWriteStream(outputZipPath);

    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
        console.log(`Archive created successfully. Total bytes: ${archive.pointer()}`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    filePaths.forEach(filePath => {
        const fileName = filePath.split('\\').pop(); // Extract the file name
        if (fileName) {
            archive.file(filePath, { name: fileName });
        }
    });

    archive.finalize();
}

// Example usage:
const pdfPaths = [
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually.pdf',
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter.pdf',
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter2.pdf'
];

const outputZipPath = 'C:\\Users\\chetan\\Documents\\_testPDF\\output2.zip';

zipFiles(pdfPaths, outputZipPath);
