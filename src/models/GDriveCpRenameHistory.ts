import * as mongoose from 'mongoose';

export interface IGDriveCpRenameHistory {
  commonRunId: string;
  runId: string;
  success: boolean;
  error?: string;
  googleDriveLink: string;
  mainGDriveLink: string;
  fileId?: string;
  oldName?: string;
  newName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GDriveCpRenameHistoryDocument = IGDriveCpRenameHistory & mongoose.Document;
export type GDriveCpRenameHistoryModel = mongoose.Model<GDriveCpRenameHistoryDocument>;

const GDriveCpRenameHistorySchema = new mongoose.Schema(
  {
    commonRunId: { type: String, required: true, index: true },
    runId: { type: String, required: true, index: true },
    success: { type: Boolean, required: true },
    error: { type: String, required: false },
    googleDriveLink: { type: String, required: true, index: true },
    mainGDriveLink: { type: String, required: true, index: true },
    fileId: { type: String, required: false, index: true },
    oldName: { type: String, required: false },
    newName: { type: String, required: false },
  },
  {
    collection: 'GDriveCpRenameHistory',
    timestamps: true,
  }
);

export const GDriveCpRenameHistory: GDriveCpRenameHistoryModel =
  mongoose.model<GDriveCpRenameHistoryDocument>(
    'GDriveCpRenameHistory',
    GDriveCpRenameHistorySchema
  );
