// Configuration
export interface Config {
    inputFolder: string;
    reducedFolder: string;
    outputSuffix: string;
    batchSize: number;
    dryRun: boolean;
    renameInPlace: boolean;
    delayBetweenCallsMs?: number; // Delay between API calls in ms
    delayBetweenBatchesMs?: number; // Delay between processing batches in ms
}

export interface RenamingResult{
    originalFilePath: string;
    reducedFilePath: string;
    fileName: string;
    extractedMetadata: string;
    success: boolean;
    error?: string;
    newFilePath: string;
}
export interface MetadataResult {
    originalFilePath: string;
    fileName: string;
    extractedMetadata: string;
    error?: string;
}
  
export type PdfPair = {
    index: number;         // 0-based
    pdf: string;           // item from allPdfs
    reducedPdf: string;    // corresponding item from allReducedPdfs
};

export type BatchPair = {
    index: number;          // 0-based
    pdfs: string[];         // batch from allPdfs
    reducedPdfs: string[];  // corresponding batch from allReducedPdfs
};

export const AI_RENAMING_WORKFLOW_CONFIG:Config = {
    inputFolder: "",
    reducedFolder: "",
    outputSuffix: "", // Set to a path to copy renamed files to a new location
    batchSize: 3,       // Number of PDFs to process in a batch (reduced to avoid rate limits)
    dryRun: false,      // Set to true to see what would be renamed without actually renaming
    renameInPlace: false, // Set to false to copy files to outputFolder instead of renaming in place
    delayBetweenCallsMs: 2000,  // Wait 2 seconds between API calls
    delayBetweenBatchesMs: 10000  // Wait 10 seconds between batches
}

