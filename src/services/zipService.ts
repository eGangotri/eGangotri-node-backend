import * as fs from 'fs';
import archiver from 'archiver';

<<<<<<< HEAD
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
=======

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
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
}

// Example usage:
const pdfPaths = [
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually.pdf',
<<<<<<< HEAD
=======
    "C:\\Users\\chetan\\Documents\\Aug 29 Meeting.pdf",
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter.pdf',
    'C:\\Users\\chetan\\Documents\\_testPDF\\output-t1-2-reduced-manually-withFooter2.pdf'
];

<<<<<<< HEAD
const outputZipPath = 'C:\\Users\\chetan\\Documents\\_testPDF\\output2.zip';

zipFiles(pdfPaths, outputZipPath);
=======
const outputZipPath = 'C:\\Users\\chetan\\Downloads\\output3.zip';

//yarn run zipFiles

// zipFiles(pdfPaths, outputZipPath, "C:\\Users\\chetan\\Documents")
//     .then(() => console.log('Zipping completed successfully'))
//     .catch(err => console.error('Error during zipping:', err));
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
