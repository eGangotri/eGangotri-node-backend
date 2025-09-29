import * as mongoose from 'mongoose';

export interface IPdfTitleRenamingViaAITracker {
  runId: string;

  // Context of the run
  srcFolder?: string;
  reducedFolder?: string;
  outputFolder?: string;
  batchIndex?: number;
  indexInBatch?: number;

  // File details
  originalFilePath: string;
  reducedFilePath?: string;
  fileName: string;

  // AI metadata & outcome
  extractedMetadata?: string;
  error?: string;
  newFilePath?: string;

  // Mongoose timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export type PdfTitleRenamingViaAITrackerDocument = IPdfTitleRenamingViaAITracker & mongoose.Document;
export type PdfTitleRenamingViaAITrackerModel = mongoose.Model<PdfTitleRenamingViaAITrackerDocument>;

const PdfTitleRenamingTrackerViaAISchema = new mongoose.Schema(
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
    collection: 'PDF_TITLE_RENAMING_VIA_AI_TRACKER',
    timestamps: true,
  }
);

export const PdfTitleRenamingViaAITracker: PdfTitleRenamingViaAITrackerModel =
  mongoose.model<PdfTitleRenamingViaAITrackerDocument>(
    'PDF_TITLE_RENAMING_VIA_AI_TRACKER',
    PdfTitleRenamingTrackerViaAISchema
  );
