import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getAllPdfsInFoldersRecursive, chunk } from "../../../imgToPdf/utils/Utils";
import { processWithGoogleAI, MetadataResult } from './googleAiService';

// Configuration
interface Config {
    inputFolders: string[];
    outputFolder: string | null;
    batchSize: number;
    dryRun: boolean;
    renameInPlace: boolean;
    delayBetweenCallsMs?: number; // Delay between API calls in ms
    delayBetweenBatchesMs?: number; // Delay between processing batches in ms
}

/**
 * Clean and format the metadata string for use as a filename
 * @param metadata - The metadata string from Google AI
 * @returns Cleaned and formatted string
 */
function formatFilename(metadata: string): string {
    // Remove any invalid filename characters
    let cleanName = metadata
        .replace(/[\\/:*?"<>|]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
        .trim();                        // Remove leading/trailing spaces
    
    // Ensure the filename isn't too long (Windows has a 260 character path limit)
    if (cleanName.length > 200) {
        cleanName = cleanName.substring(0, 197) + '...';
    }
    
    return cleanName + '.pdf';
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process a batch of PDFs with Google AI Studio
 * @param pdfs - Array of PDF file paths to process
 * @param config - Configuration options
 * @returns Array of processing results
 */
async function processPdfBatch(pdfs: string[], config: Config): Promise<MetadataResult[]> {
    console.log(`Processing batch of ${pdfs.length} PDFs...`);
    
    const results: MetadataResult[] = [];
    const delayBetweenCalls = config.delayBetweenCallsMs || 2000; // Default to 2 seconds between API calls
    
    for (let i = 0; i < pdfs.length; i++) {
        const pdfPath = pdfs[i];
        try {
            console.log(`Processing: ${path.basename(pdfPath)}`);
            
            // Add delay between API calls to avoid rate limiting, except for the first call
            if (i > 0) {
                console.log(`Waiting ${delayBetweenCalls/1000}s before next API call to avoid rate limits...`);
                await sleep(delayBetweenCalls);
            }
            
            const result = await processWithGoogleAI(pdfPath);
            
            console.log(`Result for ${path.basename(pdfPath)}: ${result.extractedMetadata || 'No metadata extracted'}`);
            if (result.error) {
                console.error(`Error: ${result.error}`);
            }
            
            results.push(result);
        } catch (error) {
            console.error(`Failed to process ${pdfPath}:`, error);
            results.push({
                originalFilePath: pdfPath,
                fileName: path.basename(pdfPath),
                extractedMetadata: '',
                error: error.message || 'Unknown error occurred'
            });
        }
    }
    
    return results;
}

/**
 * Rename a PDF file based on its metadata
 * @param result - Metadata result from Google AI
 * @param config - Configuration options
 * @returns The new file path if renamed successfully, or the original path if not
 */
async function renamePdf(result: MetadataResult, config: Config): Promise<string> {
    if (!result.extractedMetadata) {
        console.log(`Skipping rename for ${result.fileName} - no metadata extracted`);
        return result.originalFilePath;
    }
    
    const formattedFilename = formatFilename(result.extractedMetadata);
    const originalDir = path.dirname(result.originalFilePath);
    
    // Determine the target directory
    const targetDir = config.renameInPlace ? originalDir : 
                      (config.outputFolder || path.join(originalDir, 'renamed'));
    
    // Create output directory if it doesn't exist
    if (!config.dryRun && !config.renameInPlace && !fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const newFilePath = path.join(targetDir, formattedFilename);
    
    if (config.dryRun) {
        console.log(`DRY RUN - Would rename: ${result.fileName} -> ${formattedFilename}`);
        return result.originalFilePath;
    }
    
    try {
        if (config.renameInPlace) {
            // Rename in place
            fs.renameSync(result.originalFilePath, newFilePath);
        } else {
            // Copy to new location
            fs.copyFileSync(result.originalFilePath, newFilePath);
        }
        console.log(`Renamed: ${result.fileName} -> ${formattedFilename}`);
        return newFilePath;
    } catch (error) {
        console.error(`Failed to rename ${result.fileName}:`, error);
        return result.originalFilePath;
    }
}

/**
 * Main function to process PDFs with Google AI Studio and rename them
 */
async function main() {
    try {
        // Load environment variables
        dotenv.config();
        
        // Configuration
        const config: Config = {
            inputFolders: process.argv.length > 2 ? 
                         process.argv.slice(2) : 
                         ["C:\\tmp\\aiTest\\aiSrc"],
            outputFolder: "C:\\tmp\\aiTest\\aiDest", // Set to a path to copy renamed files to a new location
            batchSize: 3,       // Number of PDFs to process in a batch (reduced to avoid rate limits)
            dryRun: true,      // Set to true to see what would be renamed without actually renaming
            renameInPlace: false, // Set to false to copy files to outputFolder instead of renaming in place
            delayBetweenCallsMs: 2000,  // Wait 2 seconds between API calls
            delayBetweenBatchesMs: 10000  // Wait 10 seconds between batches
        };
        
        console.log(`Starting PDF renaming with Google AI Studio...`);
        console.log(`Input folders:`, config.inputFolders);
        
        // Get all PDF files from input folders
        const allPdfs = await getAllPdfsInFoldersRecursive(config.inputFolders);
        console.log(`Found ${allPdfs.length} PDFs to process`);
        
        // Process PDFs in batches
        const batches = chunk(allPdfs, config.batchSize);
        let processedCount = 0;
        let successCount = 0;
        
        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1}/${batches.length}...`);
            const results = await processPdfBatch(batches[i], config);
            
            // Rename PDFs based on results
            for (const result of results) {
                const newFilePath = await renamePdf(result, config);
                processedCount++;
                if (newFilePath !== result.originalFilePath) {
                    successCount++;
                }
            }
            
            console.log(`Progress: ${processedCount}/${allPdfs.length} (${successCount} successfully renamed)`);
            
            // Add delay between batches to avoid rate limits, except for the last batch
            if (i < batches.length - 1 && config.delayBetweenBatchesMs) {
                console.log(`Waiting ${config.delayBetweenBatchesMs/1000}s before processing next batch to avoid rate limits...`);
                await sleep(config.delayBetweenBatchesMs);
            }
        }
        
        console.log(`\nComplete! Processed ${processedCount} PDFs`);
        console.log(`Successfully renamed: ${successCount}`);
        console.log(`Failed to rename: ${processedCount - successCount}`);
        
    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);