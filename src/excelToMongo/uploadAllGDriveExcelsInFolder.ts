import fs from 'fs';
import path from 'path';
import { gDriveExceltoMongo } from './tranferGDriveExcelToMongo';

/**
 * Uploads ALL Excel files in a given directory to MongoDB.
 * It primarily searches for "S.No", "Title in Google Drive" (Col.2) inside the Excel.
 */
async function uploadAllGDriveExcelsInFolder(directoryPath: string) {
    console.log(`Scanning directory for Excel files: ${directoryPath}`);

    try {
        const files = fs.readdirSync(directoryPath);
        const excelFiles = files.filter(file => file.endsWith('.xlsx') || file.endsWith('.xls'));

        if (excelFiles.length === 0) {
            console.log("No Excel files found in the specified directory.");
            return;
        }

        console.log(`Found ${excelFiles.length} Excel files. Starting upload...`);

        for (const file of excelFiles) {
            const absoluteExcelPath = path.join(directoryPath, file);
            console.log(`\n================================`);
            console.log(`Processing Excel: ${file}`);
            console.log(`================================`);
            // The existing function takes a path to a specific Excel file.
            await gDriveExceltoMongo(absoluteExcelPath);
        }

        console.log(`\nAll ${excelFiles.length} Excel files have been processed.`);
        process.exit(0);
    } catch (err) {
        console.error(`Error reading directory or uploading:`, err);
        process.exit(1);
    }
}

// Extract path from CLI arguments, e.g.:
// pnpm run ts-node ./src/excelToMongo/uploadAllGDriveExcelsInFolder.ts "C:/path/to/folder"
const args = process.argv.slice(2);
const folderArg = args[0];

if (!folderArg) {
    console.error("Please provide the folder path as an argument!");
    console.log("Usage: ts-node ./src/excelToMongo/uploadAllGDriveExcelsInFolder.ts \"C:/path/to/folder\"");
    process.exit(1);
}

uploadAllGDriveExcelsInFolder(folderArg);
