import * as mongoose from 'mongoose';

export interface IMergeOperationData {
  input_folder: string;
  output_folder: string;
  nFirstPages: number;
  nLastPages: number;
}

export interface IMergeOperationResult {
  status: boolean;
  message: string;
  data?: IMergeOperationData;
}

export interface IMergeMultiplePdfTracker {
  commonRunId: mongoose.Types.ObjectId; // objectID
  runId: mongoose.Types.ObjectId; // objectID

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
    commonRunId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    runId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    first_pdf_path: { type: String, required: true },
    second_pdf_path: { type: String, required: true },
    third_pdf_path: { type: String, required: false },

    operationResult: {
      status: { type: Boolean, required: true },
      message: { type: String, required: true },
      data: {
        input_folder: { type: String, required: false },
        output_folder: { type: String, required: false },
        nFirstPages: { type: Number, required: false },
        nLastPages: { type: Number, required: false },
      },
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
