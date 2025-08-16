import * as XLSX from 'xlsx';
import { aksharamukhaIastToRomanColloquial } from '../aksharamukha/convert';

async function processExcel(inputFile: string) {
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(inputFile);
        console.log('Available sheets:', workbook.SheetNames);
        
        if (workbook.SheetNames.length < 2) {
            throw new Error('Sheet2 not found in workbook');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[1]]; // Using Sheet 2
        
        // Convert worksheet to JSON and get headers
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        const headers = data[0] as Record<string, string>;
        console.log('Headers:', headers);
        
        // Process each row starting from index 1 (after headers)
        for (let i = 1; i < data.length; i++) {
            const row = data[i] as Record<string, any>;
            if (row['D']) { // Column D
                try {
                    console.log(`Processing row ${i + 1}, text:`, row['D']);
                    const romanized = await aksharamukhaIastToRomanColloquial(row['D'].toString());
                    console.log(`Romanized result:`, romanized);
                    row['M'] = romanized; // Column M
                } catch (error) {
                    console.error(`Error processing row ${i + 1}:`, error);
                    row['M'] = 'ERROR: Conversion failed';
                }
            }
        }
        
        // Convert back to worksheet
        const newWorksheet = XLSX.utils.json_to_sheet(data, { header: Object.keys(headers) });
        workbook.Sheets[workbook.SheetNames[1]] = newWorksheet;
        
        // Generate output filename
        const outputFile = inputFile.replace('.xlsx', '_processed.xlsx');
        
        // Write the file
        XLSX.writeFile(workbook, outputFile);
        console.log(`Processed file saved as: ${outputFile}`);
    } catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
    }
}

// Example usage
if (process.argv.length < 3) {
    console.log('Please provide the Excel file path');
    process.exit(1);
}

const inputFile = process.argv[2];
processExcel(inputFile).catch(console.error);
