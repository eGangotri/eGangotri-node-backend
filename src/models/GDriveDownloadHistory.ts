import mongoose, { Document, Schema } from 'mongoose';
import { DownloadHistoryStatus } from '../utils/constants';

export interface ICompositeDocument {
    fileName: string;
    filePath: string;
    status: DownloadHistoryStatus;
    msg: string;
}

export interface QuickStatus {
    status?: string;
    success_count?: number|string;
    error_count?: number|string;
    dl_wrong_size_count?: string;
    totalPdfsToDownload?: number|string;
    error?:string;
    attemptDate?: Date;
}

const CompositeDocumentSchema: Schema = new Schema(
    {
        fileName: { type: String, required: true },
        filePath: { type: String, required: false },
        status: { type: String, enum: Object.values(DownloadHistoryStatus), required: true },
        msg: { type: String, required: false },
    },
    { _id: false }
);

export interface IGDriveDownload extends Document {
    status: DownloadHistoryStatus;
    createdAt: Date;
    updatedAt: Date;
    totalCount: number;
    runId: string;
    commonRunId: string;
    msg: string;
    googleDriveLink: string;
    profileNameOrAbsPath: string;
    fileDumpFolder: string;
    gDriveRootFolder: string;
    downloadType: string;
    ignoreFolder: string;
    files: ICompositeDocument[];
    quickStatus: QuickStatus[];  
    verify: boolean;    
    deleted: boolean;
}

const QuickStatusSchema: Schema = new Schema(
    {
        status: { type: String, required: true },
        success_count: { type: Number, required: true },
        dl_wrong_size_count: { type: Number, required: true },
        error_count: { type: Number, required: true },
        totalPdfsToDownload: { type: Number, required: true },
        attemptDate: { type: Date, required: false, default: Date.now },
    },
    { _id: false }
);

const COLLECTION_NAME = 'GDriveDownloadHistory'
const GDriveDownloadHistorySchema: Schema = new Schema(
    {
        googleDriveLink: { type: String, required: true },
        totalCount: { type: Number, required: false, default: 0 },
        runId: { type: String, required: true },
        commonRunId: { type: String, required: true },
        profileNameOrAbsPath: { type: String, required: true },
        fileDumpFolder: { type: String, required: true },
        gDriveRootFolder: { type: String, required: false },
        status: { type: String, enum: Object.values(DownloadHistoryStatus), default: 'queued' },
        msg: { type: String, required: false },
        ignoreFolder: { type: String, required: false },
        downloadType: { type: String, required: true },
        files: { type: [CompositeDocumentSchema], required: true },
        quickStatus: { type: [QuickStatusSchema], required: false, default: [] },  
        verify: { type: Boolean, required: false },
        deleted: { type: Boolean, required: false, default: false },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
        // Add indexes for frequently queried fields
        indexes: [
            { googleDriveLink: 1 },
            { runId: 1 },
            { status: 1 },
            { createdAt: -1 },
            { profileNameOrAbsPath: 1 },
            { downloadType: 1 },
            // Compound indexes for common query patterns
            { status: 1, createdAt: -1 },
            { googleDriveLink: 1, status: 1, runId: 1 }
        ]
    }
);

const GDriveDownload = mongoose.model<IGDriveDownload>(COLLECTION_NAME, GDriveDownloadHistorySchema);

export default GDriveDownload;