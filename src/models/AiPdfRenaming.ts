import * as mongoose from 'mongoose';

const AiPdfRenamingSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },

    // Context of the run
    srcFolder: { type: String, required: false },
    reducedFolder: { type: String, required: false },
    outputFolder: { type: String, required: false },
    batchIndex: { type: Number, required: false },
    indexInBatch: { type: Number, required: false },

    // File details
    originalFilePath: { type: String, required: true },
    reducedFilePath: { type: String, required: false },
    fileName: { type: String, required: true },

    // AI metadata & outcome
    extractedMetadata: { type: String, required: false },
    error: { type: String, required: false },
    newFilePath: { type: String, required: false },
  },
  {
    collection: 'AI_PDF_RENAMING',
    timestamps: true,
  }
);

export const AiPdfRenaming = mongoose.model('AI_PDF_RENAMING', AiPdfRenamingSchema);
