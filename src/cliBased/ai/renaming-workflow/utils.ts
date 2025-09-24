import { BatchPair, PdfPair } from "./constants";

export function buildPairedPdfs(allPdfs: string[], allReducedPdfs: string[]): PdfPair[] {
    if (allPdfs.length !== allReducedPdfs.length) {
        throw new Error(`Input arrays must be the same length. allPdfs=${allPdfs.length}, allReducedPdfs=${allReducedPdfs.length}`);
    }
    return allPdfs.map((pdf, index) => ({
        index,
        pdf,
        reducedPdf: allReducedPdfs[index],
    }));
}

export function buildPairedBatches(batches: string[][], batchesReduced: string[][]): BatchPair[] {
    if (batches.length !== batchesReduced.length) {
        return []
    }
    return batches.map((pdfs, index) => ({
        index,
        pdfs,
        reducedPdfs: batchesReduced[index],
    }));
}


/**
 * Clean and format the metadata string for use as a filename
 * @param metadata - The metadata string from Google AI
 * @returns Cleaned and formatted string
 */
export function formatFilename(metadata: string): string {
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