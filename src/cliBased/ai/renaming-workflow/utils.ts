
export type PdfPair = {
    index: number;         // 0-based
    pdf: string;           // item from allPdfs
    reducedPdf: string;    // corresponding item from allReducedPdfs
};

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

export type BatchPair = {
    index: number;          // 0-based
    pdfs: string[];         // batch from allPdfs
    reducedPdfs: string[];  // corresponding batch from allReducedPdfs
};

export function buildPairedBatches(batches: string[][], batchesReduced: string[][]): BatchPair[] {
    if (batches.length !== batchesReduced.length) {
        throw new Error(`Batch arrays must be the same length. batches=${batches.length}, batchesReduced=${batchesReduced.length}`);
    }
    return batches.map((pdfs, index) => ({
        index,
        pdfs,
        reducedPdfs: batchesReduced[index],
    }));
}
