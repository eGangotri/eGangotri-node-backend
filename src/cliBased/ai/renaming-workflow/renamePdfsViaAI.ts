import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { getAllPdfsInFoldersRecursive, chunk } from "../../../imgToPdf/utils/Utils";
import { processWithGoogleAI } from './googleAiService';
import { buildPairedBatches, formatFilename } from './utils';
import { PdfTitleAndFileRenamingTrackerViaAI } from '../../../models/pdfTitleAndFileRenamingTrackerViaAI';
import { PdfTitleRenamingViaAITracker } from '../../../models/pdfTitleRenamingTrackerViaAI';
import { isPDFCorrupted } from '../../../utils/pdfValidator';
import { AI_RENAMING_WORKFLOW_CONFIG, BatchPair, Config, MetadataResult, RenamingResult } from './types';
import { AI_BATCH_SIZE, AI_DELAY_BETWEEN_BATCHES_MS, AI_DELAY_BETWEEN_CALLS_MS, PDF_VALIDATE_TIMEOUT_MS, sleep } from './constants';

/**
 * Sleep for a specified number of milliseconds
 * @param ms - milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
//const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
               // console.log(`Waiting ${delayBetweenCalls / 1000}s for next batch before next API call to avoid rate limits...`);
                await sleep(delayBetweenCalls);
            }

            // Validate PDF quickly before sending to AI
            const validateTimeout = Number(PDF_VALIDATE_TIMEOUT_MS || 5000);
            const validity = await isPDFCorrupted(pdfPath, { quickCheck: true, timeoutMs: validateTimeout });
            if (!validity.isValid) {
                const errMsg = `Invalid/Corrupt PDF: ${validity.error || 'Unknown error'}`;
                console.error(`${errMsg} (${path.basename(pdfPath)})`);
                results.push({
                    originalFilePath: pdfPath,
                    fileName: path.basename(pdfPath),
                    extractedMetadata: '',
                    error: errMsg,
                });
                continue;
            }

            const result = await processWithGoogleAI(pdfPath);
            console.log(`result: ${JSON.stringify(result)}`)
            console.log(`Result for ${path.basename(pdfPath)}: ${result.extractedMetadata || 'No metadata extracted'}`);
            if (result.error) {
                console.error(`processWithGoogleAI:Error(${path.basename(pdfPath)}): ${result.error}`);
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



async function renamePdfUsingMetadata(result: MetadataResult,
    config: Config,
    outputFolder: string): Promise<{ newFilePath: string; error?: string; }> {
    if (!result.extractedMetadata) {
        console.log(`Skipping rename for ${result.fileName} - no metadata extracted`);
        return {
            newFilePath: "error",
            error: 'No metadata extracted'
        }
    }

    const formattedFilename = formatFilename(result.extractedMetadata);
    const pdfParentDir = path.dirname(result.originalFilePath);
    const relativePath = path.relative(config.inputFolder, pdfParentDir);

    // Determine the target directory
    const targetDir = config.renameInPlace ? pdfParentDir :
        path.join(outputFolder, relativePath);

    // Create output directory if it doesn't exist
    if (!config.dryRun && !config.renameInPlace && !fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const newFilePath = path.join(targetDir, formattedFilename);


    console.log(`Target directory: ${targetDir}`);
    console.log(`relativePath: ${relativePath}`);
    console.log(`newFilePath: ${newFilePath}`);

    if (config.dryRun) {
        console.log(`DRY RUN - Would rename: ${result.fileName} -> ${newFilePath}`);
        return {
            newFilePath,
            error: 'Dry run'
        }
    }

    try {
        if (config.renameInPlace) {
            // Rename in place
            fs.renameSync(result.originalFilePath, formattedFilename);
            console.log(`Renamed: ${result.fileName} -> ${formattedFilename}`);
        } else {
            // Copy to new location
            fs.copyFileSync(result.originalFilePath, newFilePath);
            console.log(`Copied: ${result.fileName} -> ${newFilePath}`);
        }
        return {
            newFilePath,
        };
    } catch (error) {
        console.error(`Failed to rename ${result.fileName}:`, error);
        return {
            newFilePath: "err",
            error: error.message || 'Unknown error occurred'
        }
    }
}


export async function aiRenameTitleUsingReducedFolder(inputFolder: string,
    reducedFolder: string,
    outputSuffix: string = "-renamer", commonRunId: string) {
    console.log(`aiRenameTitleUsingReducedFolder srcFolder: ${inputFolder}, reducedFolder: ${reducedFolder}, outputSuffix: ${outputSuffix}`);
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    try {
        const runId = randomUUID();

        const config: Config = {
            ...AI_RENAMING_WORKFLOW_CONFIG,
            inputFolder,
            reducedFolder,
            outputSuffix,
            batchSize: Number.isFinite(AI_BATCH_SIZE) && AI_BATCH_SIZE > 0 ? AI_BATCH_SIZE : AI_RENAMING_WORKFLOW_CONFIG.batchSize,
            delayBetweenCallsMs: Number.isFinite(AI_DELAY_BETWEEN_CALLS_MS) && AI_DELAY_BETWEEN_CALLS_MS >= 0 ? AI_DELAY_BETWEEN_CALLS_MS : AI_RENAMING_WORKFLOW_CONFIG.delayBetweenCallsMs,
            delayBetweenBatchesMs: Number.isFinite(AI_DELAY_BETWEEN_BATCHES_MS) && AI_DELAY_BETWEEN_BATCHES_MS >= 0 ? AI_DELAY_BETWEEN_BATCHES_MS : AI_RENAMING_WORKFLOW_CONFIG.delayBetweenBatchesMs,
        }

        const outputFolder = path.join(path.dirname(inputFolder), outputSuffix);

        console.log(`output folder: ${outputFolder}`);
        if (!fs.existsSync(outputFolder)) {
            console.log(`Creating output folder: ${outputFolder}`);
            fs.mkdirSync(outputFolder, { recursive: true });
        }

        console.log(`Starting PDF renaming with Google AI Studio...`);
        console.log(`Input folders:`, config.inputFolder);

        // Get all PDF files from input folders
        const allPdfs = await getAllPdfsInFoldersRecursive([config.inputFolder]);
        const allReducedPdfs = await getAllPdfsInFoldersRecursive([config.reducedFolder]);

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
                errorCount,
                pairedBatches: [],
                error: `Batch arrays must be the same length. batches=${batches.length}, batchesReduced=${batchesReduced.length}`,
                success: false
            }
        }

        const pairedBatches: BatchPair[] = buildPairedBatches(batches, batchesReduced);

        const renamingResults: Array<RenamingResult> = [];

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
                    commonRunId,
                    runId,
                    srcFolder: inputFolder,
                    reducedFolder,
                    outputFolder,
                    batchIndex: i,
                    indexInBatch: j,
                    originalFilePath: pairedBtch.pdfs[j],
                    reducedFilePath: pairedBtch.reducedPdfs[j],
                    fileName: path.basename(pairedBtch.pdfs[j]),
                    extractedMetadata: aiRes.extractedMetadata,
                    error: aiRes.error,
                    newFilePath: path.join(outputFolder, aiRes.extractedMetadata)
                }));
                if (perItemDocs.length > 0) {
                    await PdfTitleRenamingViaAITracker.insertMany(perItemDocs);
                }
            } catch (perItemErr) {
                console.error('Failed inserting AI_PDF_RENAMING batch docs:', perItemErr);
            }

            processedCount += results.length;
            successCount += results.filter(r => !r.error && !!r.extractedMetadata).length;

            console.log(`Progress: ${processedCount}/${allPdfs.length} (${successCount} successfully extracted)`);

            // Add delay between batches to avoid rate limits, except for the last batch
            if (i < batches.length - 1 && config.delayBetweenBatchesMs) {
                console.log(`Waiting (per batch) ${config.delayBetweenBatchesMs / 1000}s in-btwn batch calls before processing next batch to avoid rate limits...`);
                await sleep(config.delayBetweenBatchesMs);
            }
        }

        // Validate aggregation
        const metadataAggregationNoError = mappedResults.every(m => !m.meta.error);
        if (metadataAggregationNoError && (mappedResults.length === allPdfs.length)) {
            let renamedCount = 0;
            for (let i = 0; i < mappedResults.length; i++) {
                const item = mappedResults[i];
                const renamingResultPath = await renamePdfUsingMetadata(item.meta, config, outputFolder);
                const newFilePath = renamingResultPath.newFilePath ?? "N/A";
                if (renamingResultPath.error) {
                    console.error(`Failed to rename ${item.meta.fileName}:`, renamingResultPath.error);
                    renamingResults.push({
                        originalFilePath: item.meta.originalFilePath,
                        reducedFilePath: item.reducedFilePath,
                        fileName: item.meta.fileName,
                        extractedMetadata: item.meta.extractedMetadata,
                        error: renamingResultPath.error,
                        success: false,
                        newFilePath
                    });
                    continue;
                }

                renamedCount++;
                console.log(`Renamed: ${item.meta.fileName} -> ${newFilePath}`);
                renamingResults.push({
                    originalFilePath: item.meta.originalFilePath,
                    reducedFilePath: item.reducedFilePath,
                    fileName: item.meta.fileName,
                    success: true,
                    extractedMetadata: item.meta.extractedMetadata,
                    error: item.meta.error,
                    newFilePath
                });
            }

            console.log(`\nComplete! Processed ${processedCount} PDFs`);
            console.log(`Successfully renamed: ${renamedCount}`);
            console.log(`Failed to rename: ${processedCount - renamedCount}`);

            const _res = {
                commonRunId,
                runId,
                processedCount,
                successCount,
                failedCount: processedCount - successCount,
                renamedCount,
                success: true,
                renamingResults,
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
                    commonRunId,
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
                commonRunId,
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
