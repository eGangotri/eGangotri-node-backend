import { PDFDocument } from 'pdf-lib';
import { readdir, readFile, writeFile } from 'fs-extra';
import path, { join } from 'path';
import { getAllFileStats } from '../utils/FileStatsUtils';

export async function convertJpgsToPdf(inputFolder: string, outputFolder = "") {
    try {
        const pdfDoc = await PDFDocument.create();
        const jpegFiles = (await readdir(inputFolder)).filter(file => file.endsWith('.jpeg') || file.endsWith('.jpg')
            || file.endsWith('.JPEG') || file.endsWith('.JPG'));
        const generatedPdf = outputFolder?.length > 0 ? outputFolder : inputFolder + path.sep + path.basename(inputFolder) + '.pdf';
        let counter = 0;
        if (jpegFiles.length === 0) {
            return {
                inputFolder,
                error: 'No JPEG files found in the input folder',
                success: false
            };
        }
        for (const jpegFile of jpegFiles) {
            const jpegPath = join(inputFolder, jpegFile);
            const jpegImageBytes = await readFile(jpegPath);
            const jpegImage = await pdfDoc.embedJpg(jpegImageBytes);
            const page = pdfDoc.addPage([jpegImage.width, jpegImage.height]);
            //console.log(`Adding file#${++counter} ${jpegFile} to PDF...`)
            page.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: jpegImage.width,
                height: jpegImage.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        await writeFile(generatedPdf, pdfBytes);

        console.log(`PDF created at ${generatedPdf} from inputFolder: ${inputFolder} with ${jpegFiles.length} pages.`);
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

export const convertJpgsToPdfInAllSubFolders = async (inputFolder: string, outputFolder = "") => {
    let success_count = 0;
    let error_count = 0;

    try {
        const allFiles = await getAllFileStats({ directoryPath: inputFolder, ignoreFolders: false, withLogs: false, withMetadata: false });
        const allFolders = allFiles.filter(file => file.ext === "FOLDER")
        allFolders.push({
            absPath: inputFolder,
            fileName: path.basename(inputFolder),
            folder: path.dirname(inputFolder),
            ext: "FOLDER"
        });
        const promise = []
        let counter = 0;
        allFolders.map(async (folder) => {
            console.log(`Processing Folder#${++counter} ${folder.absPath}`);
            try {
                const _convertResult = convertJpgsToPdf(folder.absPath, outputFolder);
                promise.push(_convertResult);
            }
            catch (e) {
                console.error(`Error while processing folder: ${folder.absPath}`, e);
                error_count++;
            }
        });
        const all = await Promise.all(promise);
        return {
            success_count: all.filter((res: any) => res.success).length,    
            error_count: all.filter((res: any) => !res.success).length,
            exception_count: error_count,
            totalFolderCount: allFolders.length,
            foldersProcessed: all.length,
            eqaulity: allFolders.length === all.length,
            msg: `${all.length} folders processed in ${inputFolder} with ${allFolders.length} subFolders.`,
            ...all,
        }
    }
    catch (e) {
        console.error('Error during conversion:', e);
    }
}
