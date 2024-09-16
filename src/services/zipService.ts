import * as fs from 'fs';
import archiver from 'archiver';


export async function zipFiles(filePaths: string[], outputZipPath: string, rootDirToMaintainOrigFolderOrder = ""): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on('close', () => {
            console.log(`Archive ${outputZipPath} created successfully. Total bytes: ${archive.pointer()}`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        filePaths.forEach(filePath => {
            if (rootDirToMaintainOrigFolderOrder === "") {
                const fileName = filePath.split('\\').pop(); // Extract the file name
                if (fileName) {
                    archive.file(filePath, { name: fileName });
                }
            }
            else {
                console.log(`filePath : ${filePath} rootDirToMaintainOrigFolderOrder : ${rootDirToMaintainOrigFolderOrder}`);
                const relativePath = filePath.split('C:\\Users\\chetan\\Documents').pop(); // Adjust the base directory as needed
                if (relativePath) {
                    archive.file(filePath, { name: relativePath });
                }
            }
        });

        archive.finalize();
    });
}

// Example usage:
const pdfPaths = [
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually.pdf',
    "C:\\Users\\chetan\\Documents\\Aug 29 Meeting.pdf",
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter.pdf',
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter2.pdf'
];

const outputZipPath = 'C:\\Users\\chetan\\Downloads\\output3.zip';

//yarn run zipFiles

// zipFiles(pdfPaths, outputZipPath, "C:\\Users\\chetan\\Documents")
//     .then(() => console.log('Zipping completed successfully'))
//     .catch(err => console.error('Error during zipping:', err));
