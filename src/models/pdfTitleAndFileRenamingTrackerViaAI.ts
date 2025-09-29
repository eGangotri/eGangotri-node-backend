import * as mongoose from 'mongoose';

export interface IPdfTitleAndFileRenamingTrackerViaAI {
  runId: string;
  processedCount: number;
  successCount: number;
  failedCount: number;
  renamedCount?: number;
  success: boolean;

  // Store paired batches and renaming results for traceability
  pairedBatches?: any;

  // We will save the array returned from the workflow under this key
  renamingResults?: any[];

  // Optional diagnostic fields
  metaDataAggregated?: any[];
  error?: any;

  // Mongoose timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export type PdfTitleAndFileRenamingTrackerViaAIDocument = IPdfTitleAndFileRenamingTrackerViaAI & mongoose.Document;
export type PdfTitleAndFileRenamingTrackerViaAIModel = mongoose.Model<PdfTitleAndFileRenamingTrackerViaAIDocument>;

const PdfAiRenamingTrackerSchema = new mongoose.Schema(
  {
    runId: { type: String, required: true, index: true },
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
    collection: 'PDF_TITLE_AND_FILE_RENAMING_VIA_AI_TRACKER',
    timestamps: true,
  }
);

export const PdfTitleAndFileRenamingTrackerViaAI: PdfTitleAndFileRenamingTrackerViaAIModel =
  mongoose.model<PdfTitleAndFileRenamingTrackerViaAIDocument>(
    'PDF_TITLE_AND_FILE_RENAMING_VIA_AI_TRACKER',
    PdfAiRenamingTrackerSchema
  );
