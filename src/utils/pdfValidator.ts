import * as fs from 'fs/promises';
import { existsSync, createReadStream, statSync } from 'fs';
import { PDFDocument } from 'pdf-lib';
import { Readable } from 'stream';

interface ValidationOptions {
    quickCheck?: boolean;  // Only check header and basic structure
    maxSizeToLoad?: number; // Maximum file size in MB to fully load into memory
    timeoutMs?: number;    // Timeout for validation in milliseconds
}

/**
 * Validates if a PDF file is corrupted
 * @param filePath Path to the PDF file
 * @param options Validation options
 * @returns Object indicating if the PDF is valid with optional error message
 */
export async function isPDFCorrupted(
    filePath: string, 
    options: ValidationOptions = {}
): Promise<{ isValid: boolean; error?: string; filePath?: string }> {
    const {
        quickCheck = false,
        maxSizeToLoad = 50, // Default 50MB
        timeoutMs = 5000    // Default 5 seconds
    } = options;
    
    try {
        // Check if file exists
        if (!existsSync(filePath)) {
            return { isValid: false, error: 'File does not exist' };
        }
        
        // Check file size
        const stats = statSync(filePath);
        if (stats.size === 0) {
            return { isValid: false, error: 'File is empty', filePath };
        }
        
        // For quick check, just verify the PDF header
        if (quickCheck) {
            const headerBuffer = Buffer.alloc(8);
            const fd = await fs.open(filePath, 'r');
            try {
                await fd.read(headerBuffer, 0, 8, 0);
                const header = headerBuffer.toString('ascii', 0, 8);
                await fd.close();
                
                if (!header.startsWith('%PDF-')) {
                    return { isValid: false, error: 'Not a valid PDF file (invalid header)', filePath };
                }
                return { isValid: true };
            } catch (err) {
                await fd.close();
                throw err;
            }
        }
        
        // For larger files, use a different approach to avoid loading the entire file
        const fileSizeMB = stats.size / (1024 * 1024);
        if (fileSizeMB > maxSizeToLoad) {
            // For large files, we'll read in chunks and validate structure
            // Create a promise that will timeout
            const timeoutPromise = new Promise<{ isValid: boolean; error: string }>((_, reject) => {
                setTimeout(() => reject(new Error('Validation timed out')), timeoutMs);
            });
            
            // Create a validation promise
            const validationPromise = new Promise<{ isValid: boolean }>((resolve, reject) => {
                // Read first 1MB to check structure
                const stream = createReadStream(filePath, { start: 0, end: 1024 * 1024 });
                let headerFound = false;
                let data = Buffer.alloc(0);
                
                stream.on('data', (chunk) => {
                    data = Buffer.concat([data, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
                    const header = data.toString('ascii', 0, 8);
                    if (header.startsWith('%PDF-')) {
                        headerFound = true;
                    }
                });
                
                stream.on('end', () => {
                    if (headerFound) {
                        resolve({ isValid: true });
                    } else {
                        reject(new Error('Invalid PDF structure'));
                    }
                });
                
                stream.on('error', (err) => reject(err));
            });
            
            try {
                return await Promise.race([validationPromise, timeoutPromise]);
            } catch (error) {
                return { 
                    isValid: false, 
                    error: `PDF validation failed: ${error instanceof Error ? error.message : String(error)}`,
                    filePath
                };
            }
        }
        
        // For smaller files, use the full validation with pdf-lib
        const pdfBuffer = await fs.readFile(filePath);
        
        // Wrap in a timeout promise to prevent hanging on corrupted files
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('PDF parsing timed out')), timeoutMs);
        });
        
        const loadPromise = PDFDocument.load(pdfBuffer, {
            updateMetadata: false
        });
        
        await Promise.race([loadPromise, timeoutPromise]);
        return { isValid: true };
    } catch (error) {
        return { 
            isValid: false, 
            error: `PDF validation failed: ${error instanceof Error ? error.message : String(error)}`,
            filePath
        };
    }
}

// Example usage:
// const result = await isPDFCorrupted('path/to/your.pdf');
// if (!result.isValid) {
//     console.error(`PDF is corrupted: ${result.error}`);
// }
