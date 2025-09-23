import * as mongoose from 'mongoose';

const PdfAiRenamingTrackerSchema = new mongoose.Schema(
  {
    processedCount: { type: Number, required: true },
    successCount: { type: Number, required: true },
    failedCount: { type: Number, required: true },
    renamedCount: { type: Number, required: false },
    success: { type: Boolean, required: true },

    // Store paired batches and renaming results for traceability
    pairedBatches: { type: mongoose.Schema.Types.Mixed, required: false },

    // We will save the array returned from the workflow under this key
    renamingResults: { type: Array, required: false, default: [] },

    // Optional diagnostic fields
    metaDataAggregated: { type: Array, required: false },
    error: { type: mongoose.Schema.Types.Mixed, required: false }
  },
  {
    collection: 'PDF_AI_RENAMING_TRACKER',
    timestamps: true,
  }
);

export const PdfAiRenamingTracker = mongoose.model('PDF_AI_RENAMING_TRACKER', PdfAiRenamingTrackerSchema);
