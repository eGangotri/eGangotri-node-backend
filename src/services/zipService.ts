import * as fs from 'fs';
import archiver from 'archiver';
import * as path from 'path';
import admZip from 'adm-zip';

export async function zipFiles(filePaths: string[], 
    outputZipPath: string, 
    rootDirToMaintainOrigFolderOrder = ""): Promise<void> {
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

function findZipFiles(dir: string, zipFiles: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findZipFiles(filePath, zipFiles);
        } else if (filePath.endsWith('.zip')) {
            zipFiles.push(filePath);
        }
    }
    return zipFiles;
}

export async function unzipFiles(zipPath: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const zip = new admZip(zipPath);
            zip.extractAllTo(outputDir, true);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}


export async function unzipAllFilesInDirectory(pathToZipFiles: string, _unzipHere: string = "", ignoreFolder = ""):
 Promise<string> {
    const zipFiles = findZipFiles(pathToZipFiles);
    if(!_unzipHere || _unzipHere === ""){
        _unzipHere = pathToZipFiles + "\\unzipped";
    }

    for (const zipFile of zipFiles) {
        const outputDir = path.join(_unzipHere, path.basename(zipFile, '.zip'));
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        await unzipFiles(zipFile, outputDir);
        console.log(`Unzipped ${zipFile} to ${outputDir}`);
    }
    return _unzipHere;
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
