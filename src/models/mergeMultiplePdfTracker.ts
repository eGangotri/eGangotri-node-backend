import * as mongoose from 'mongoose';

// Merge-PDFs response data shape from Python service
export interface IMergePdfsFileInfo {
  path: string;
  size_mb: number;
  pages: number;
}

export interface IMergePdfsDetails {
  first_pdf: IMergePdfsFileInfo;
  second_pdf: IMergePdfsFileInfo;
  merged_pdf: IMergePdfsFileInfo;
  processing_time_seconds: number;
}

export interface IMergeOperationData {
  status: 'success' | 'error';
  message: string;
  details: IMergePdfsDetails;
}

export interface IMergeOperationResult {
  status: boolean;
  message: string;
  data?: IMergeOperationData;
}

export interface IMergeMultiplePdfTracker {
  commonRunId: string;
  runId: string;
  pdfPathsToMergeCount: number;
  // Inputs
  first_pdf_path: string;
  second_pdf_path: string;
  third_pdf_path?: string;

  // Result returned by merge operation
  operationResult: IMergeOperationResult;

  // Results of moving originals into _dontOldMergedPdfs. One entry per source path in the merge.
  // If you prefer only the returned string from moveOriginalIntoDontOldSubfolder, keep it as string[]
  moveResults?: Array<{
    sourcePath: string;
    movedToPath: string;
  }>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type MergeMultiplePdfTrackerDocument = IMergeMultiplePdfTracker & mongoose.Document;
export type MergeMultiplePdfTrackerModel = mongoose.Model<MergeMultiplePdfTrackerDocument>;

const MergeMultiplePdfTrackerSchema = new mongoose.Schema(
  {
    commonRunId: { type: String, required: true, index: true },
    runId: { type: String, required: true, index: true },
    pdfPathsToMergeCount: { type: Number, required: true },
    
    first_pdf_path: { type: String, required: true },
    second_pdf_path: { type: String, required: true },
    third_pdf_path: { type: String, required: false },

    operationResult: {
      status: { type: Boolean, required: true },
      message: { type: String, required: true },
      data: new mongoose.Schema(
        {
          status: { type: String, enum: ['success', 'error'], required: false },
          message: { type: String, required: false },
          details: new mongoose.Schema(
            {
              first_pdf: new mongoose.Schema(
                {
                  path: { type: String, required: false },
                  size_mb: { type: Number, required: false },
                  pages: { type: Number, required: false },
                },
                { _id: false }
              ),
              second_pdf: new mongoose.Schema(
                {
                  path: { type: String, required: false },
                  size_mb: { type: Number, required: false },
                  pages: { type: Number, required: false },
                },
                { _id: false }
              ),
              merged_pdf: new mongoose.Schema(
                {
                  path: { type: String, required: false },
                  size_mb: { type: Number, required: false },
                  pages: { type: Number, required: false },
                },
                { _id: false }
              ),
              processing_time_seconds: { type: Number, required: false },
            },
            { _id: false }
          ),
        },
        { _id: false }
      ),
    },

    moveResults: {
      type: [
        new mongoose.Schema(
          {
            sourcePath: { type: String, required: true },
            movedToPath: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      required: false,
      default: [],
    },
  },
  {
    collection: 'MERGE_MULTIPLE_PDF_TRACKER',
    timestamps: true,
  }
);

export const MergeMultiplePdfTracker: MergeMultiplePdfTrackerModel =
  mongoose.model<MergeMultiplePdfTrackerDocument>(
    'MERGE_MULTIPLE_PDF_TRACKER',
    MergeMultiplePdfTrackerSchema
  );
