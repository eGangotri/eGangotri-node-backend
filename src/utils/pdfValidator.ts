import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function isPDFCorrupted(filePath: string): Promise<{ isValid: boolean; error?: string }> {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return { isValid: false, error: 'File does not exist' };
        }

        // Read the PDF file
        const pdfBuffer = fs.readFileSync(filePath);

        // Try to load the PDF document
        await PDFDocument.load(pdfBuffer, {
            updateMetadata: false
        });

        return { isValid: true };
    } catch (error) {
        return { 
            isValid: false, 
            error: `PDF validation failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

// Example usage:
// const result = await isPDFCorrupted('path/to/your.pdf');
// if (!result.isValid) {
//     console.error(`PDF is corrupted: ${result.error}`);
// }
