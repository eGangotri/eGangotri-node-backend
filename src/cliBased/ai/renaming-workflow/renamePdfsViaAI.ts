import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { getAllPdfsInFoldersRecursive, chunk } from "../../../imgToPdf/utils/Utils";
import { processWithGoogleAI, MetadataResult } from './googleAiService';
import { buildPairedBatches, formatFilename } from './utils';
import { PdfTitleAndFileRenamingTrackerViaAI } from '../../../models/pdfTitleAndFileRenamingTrackerViaAI';
import { AiPdfRenaming } from '../../../models/pdfTitleRenamingTrackerViaAI';
import { AI_RENAMING_WORKFLOW_CONFIG, BatchPair, Config } from './constants';

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
                console.log(`Waiting ${delayBetweenCalls / 1000}s before next API call to avoid rate limits...`);
                await sleep(delayBetweenCalls);
            }

            const result = await processWithGoogleAI(pdfPath);
            console.log(`result: ${JSON.stringify(result)}`)
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



async function renamePdfUsingMetadata(result: MetadataResult, config: Config): Promise<string> {
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



export async function aiRenameUsingReducedFolder(srcFolder: string, reducedFolder: string, outputFolder: string) {
    
    let processedCount = 0;
    let successCount = 0;
    try {
        const runId = randomUUID();
        // Load environment variables
        dotenv.config();

        const config: Config = {
            ...AI_RENAMING_WORKFLOW_CONFIG ,
            inputFolders: [srcFolder],
            reducedFolders: [reducedFolder],
            outputFolder: outputFolder,
        }


        console.log(`Starting PDF renaming with Google AI Studio...`);
        console.log(`Input folders:`, config.inputFolders);

        // Get all PDF files from input folders
        const allPdfs = await getAllPdfsInFoldersRecursive(config.inputFolders);
        const allReducedPdfs = await getAllPdfsInFoldersRecursive(config.reducedFolders);

        console.log(`Found ${allPdfs.length} PDFs to process`);
        console.log(`Found ${allReducedPdfs.length} PDFs to process`);

        // Process PDFs in batches
        const batches = chunk(allPdfs, config.batchSize);
        const batchesReduced = chunk(allReducedPdfs, config.batchSize);
       
        if (batches.length !== batchesReduced.length) {
            return {
                processedCount,
                successCount,
                failedCount: processedCount - successCount,
                pairedBatches: [],
                error: `Batch arrays must be the same length. batches=${batches.length}, batchesReduced=${batchesReduced.length}`,
                success: false
            }
        }

        const pairedBatches: BatchPair[] = buildPairedBatches(batches, batchesReduced);
       
        const renamingTracker: Array<{
            originalFilePath: string;
            reducedFilePath: string;
            fileName: string;
            extractedMetadata: string;
            error?: string;
            newFilePath: string;
        }> = [];

        if (pairedBatches.length > 0) {
            console.log(`Processing ${JSON.stringify(pairedBatches[0])} batches...`)
        }

        // We'll map AI results from reduced PDFs back to the original PDFs
        const mappedResults: Array<{ meta: MetadataResult; reducedFilePath: string }> = [];

        for (let i = 0; i < pairedBatches.length; i++) {
            const pairedBtch = pairedBatches[i];
            console.log(`Processing batch ${i + 1}/${pairedBatches.length}...`);
            const results = await processPdfBatch(pairedBtch.reducedPdfs, config);

            // Map each reduced result to its corresponding original file
            for (let j = 0; j < results.length; j++) {
                const aiRes = results[j];
                const originalFilePath = pairedBtch.pdfs[j];
                const reducedFilePath = pairedBtch.reducedPdfs[j];
                const fileName = path.basename(originalFilePath);
                const mapped: MetadataResult = {
                    originalFilePath,
                    fileName,
                    extractedMetadata: aiRes.extractedMetadata,
                    error: aiRes.error
                };
                mappedResults.push({ meta: mapped, reducedFilePath });
            }

            // Persist per-item rows for this batch with common runId
            try {
                const perItemDocs = results.map((aiRes, j) => ({
                    runId,
                    srcFolder,
                    reducedFolder,
                    outputFolder,
                    batchIndex: i,
                    indexInBatch: j,
                    originalFilePath: pairedBtch.pdfs[j],
                    reducedFilePath: pairedBtch.reducedPdfs[j],
                    fileName: path.basename(pairedBtch.pdfs[j]),
                    extractedMetadata: aiRes.extractedMetadata,
                    error: aiRes.error,
                    newFilePath: undefined
                }));
                if (perItemDocs.length > 0) {
                    await AiPdfRenaming.insertMany(perItemDocs);
                }
            } catch (perItemErr) {
                console.error('Failed inserting AI_PDF_RENAMING batch docs:', perItemErr);
            }

            processedCount += results.length;
            successCount += results.filter(r => !r.error && !!r.extractedMetadata).length;

            console.log(`Progress: ${processedCount}/${allPdfs.length} (${successCount} successfully extracted)`);

            // Add delay between batches to avoid rate limits, except for the last batch
            if (i < batches.length - 1 && config.delayBetweenBatchesMs) {
                console.log(`Waiting ${config.delayBetweenBatchesMs / 1000}s before processing next batch to avoid rate limits...`);
                await sleep(config.delayBetweenBatchesMs);
            }
        }

        // Validate aggregation
        const metadataAggregationNoError = mappedResults.every(m => !m.meta.error);
        if (metadataAggregationNoError && (mappedResults.length === allPdfs.length)) {
            let renamedCount = 0;
            for (let i = 0; i < mappedResults.length; i++) {
                const item = mappedResults[i];
                const renamingResultPath = await renamePdfUsingMetadata(item.meta, config);
                renamedCount++;
                console.log(`Renamed: ${item.meta.fileName} -> ${renamingResultPath}`);
                renamingTracker.push({
                    originalFilePath: item.meta.originalFilePath,
                    reducedFilePath: item.reducedFilePath,
                    fileName: item.meta.fileName,
                    extractedMetadata: item.meta.extractedMetadata,
                    error: item.meta.error,
                    newFilePath: renamingResultPath
                });
            }

            console.log(`\nComplete! Processed ${processedCount} PDFs`);
            console.log(`Successfully renamed: ${renamedCount}`);
            console.log(`Failed to rename: ${processedCount - renamedCount}`);
             
            const _res = {
                runId,
                processedCount,
                successCount,
                failedCount: processedCount - successCount,
                renamedCount,
                success: true,
                renamingResults: renamingTracker,
                pairedBatches,
            }
            // Persist success summary in DB
            try {
                await PdfTitleAndFileRenamingTrackerViaAI.create(_res);
            } catch (dbErr) {
                console.error('Failed saving PdfTitleAndFileRenamingTrackerViaAI (success):', dbErr);
            }
            return _res
        }

        else {
            // Persist failure summary in DB
            try {
                await PdfTitleAndFileRenamingTrackerViaAI.create({
                    runId,
                    processedCount,
                    successCount,
                    failedCount: processedCount - successCount,
                    success: false,
                    metaDataAggregated: mappedResults.map(m => m.meta),
                    error: "Metadata aggregation failed",
                    pairedBatches,
                });
            } catch (dbErr) {
                console.error('Failed saving PdfTitleAndFileRenamingTrackerViaAI (failure):', dbErr);
            }

            return {
                runId,
                success: false,
                processedCount,
                successCount,
                failedCount: processedCount - successCount,
                metaDataAggregated: mappedResults.map(m => m.meta),
                renamingResults: [],
                error: "Metadata aggregation failed",
                pairedBatches,
            }
        }
    } catch (error) {
        console.error('Error in main process:', error);
        return {
            processedCount,
            successCount,
            failedCount: processedCount - successCount,
            error: 'Error in main process:' + error,
            success: false,
            pairedBatches: [],
        }
    }
}
