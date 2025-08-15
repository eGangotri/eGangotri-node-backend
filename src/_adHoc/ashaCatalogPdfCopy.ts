import * as fs from 'fs-extra';
import * as path from 'path';
import * as xlsx from 'xlsx';

/**
 * Script to copy PDFs from source location to destination with renamed filenames
 * 
 * This script reads data from Sheet 2 of an Excel file, takes the path in Column K
 * and filename in Column L, then copies the file to a destination folder with
 * the filename from Column N + ".pdf"
 */

// Configuration
const EXCEL_FILE_PATH = 'F:\\Treasures83\\_data\\nonIKS\\vajra\\Asha Catalog Matched with Local Files_processed.xlsx';
const DESTINATION_PATH = 'F:\\playground\\tmp';
const SHEET_NAME = 'Sheet2'; // Assuming the second sheet is named 'Sheet2'

// Column indices (0-based)
const COL_K = 10; // Column K (source path)
const COL_L = 11; // Column L (source filename)
const COL_N = 13; // Column N (new filename without extension)

// Ensure destination directory exists
fs.ensureDirSync(DESTINATION_PATH);

// Stats
let totalRows = 0;
let processedFiles = 0;
let skippedRows = 0;
let notFoundFiles = 0;
let errorFiles = 0;

console.log('Starting PDF copy process...');
console.log(`Reading Excel file: ${EXCEL_FILE_PATH}`);

try {
    // Read the Excel file
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error(`Excel file not found: ${EXCEL_FILE_PATH}`);
        process.exit(1);
    }

    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    
    // Check if sheet exists
    if (!workbook.SheetNames.includes(SHEET_NAME)) {
        console.error(`Sheet "${SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
        process.exit(1);
    }
    
    // Get the sheet
    const sheet = workbook.Sheets[SHEET_NAME];
    
    // Convert sheet to JSON
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    totalRows = rows.length - 1; // Subtracting 1 for header row
    console.log(`Total rows to process: ${totalRows}`);
    
    // Process each row (skip header row)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as string[];
        
        // Get values from columns
        const sourcePath = row[COL_K]?.toString().trim() || '';
        const sourceFile = row[COL_L]?.toString().trim() || '';
        const newFilename = row[COL_N]?.toString().trim() || '';
        
        // Skip if any required value is missing
        if (!sourcePath || !sourceFile || !newFilename) {
            console.log(`Skipping row ${i + 1}: Missing required data`);
            skippedRows++;
            continue;
        }
        
        // Build source and destination paths
        const sourceFilePath = path.join(sourcePath, sourceFile);
        const destinationFilePath = path.join(DESTINATION_PATH, `${newFilename}.pdf`);
        
        try {
            // Check if source file exists
            if (!fs.existsSync(sourceFilePath)) {
                console.log(`File not found: ${sourceFilePath}`);
                notFoundFiles++;
                continue;
            }
            
            // Copy file
            fs.copySync(sourceFilePath, destinationFilePath);
            console.log(`Copied: ${sourceFile} -> ${newFilename}.pdf`);
            processedFiles++;
            
        } catch (err) {
            console.error(`Error processing row ${i + 1}:`, err);
            errorFiles++;
        }
    }
    
    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total rows: ${totalRows}`);
    console.log(`Successfully copied: ${processedFiles}`);
    console.log(`Skipped (missing data): ${skippedRows}`);
    console.log(`Files not found: ${notFoundFiles}`);
    console.log(`Errors: ${errorFiles}`);
    
} catch (error) {
    console.error('Error processing Excel file:', error);
    process.exit(1);
}
