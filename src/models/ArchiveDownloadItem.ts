import * as mongoose from 'mongoose';

export interface IArchiveDownloadItem {
    runId: string;
    commonRunId: string;
    archiveUrl: string;
    fileName: string;
    filePath?: string;
    status: 'queued' | 'failed' | 'success';
    error?: string;
    msg?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ArchiveDownloadItemDocument = IArchiveDownloadItem & mongoose.Document;

const SCHEMA_NAME = 'ARCHIVE_DOWNLOAD_ITEM';
const ArchiveDownloadItemSchema = new mongoose.Schema(
    {
        runId: { type: String, required: true, index: true },
        commonRunId: { type: String, required: true, index: true },
        archiveUrl: { type: String, required: true },
        fileName: { type: String, required: true },
        filePath: { type: String, required: false },
        status: {
            type: String,
            required: true,
            enum: ['queued', 'failed', 'success'],
            default: 'queued'
        },
        error: { type: String, required: false },
        msg: { type: String, required: false },
    },
    {
        collection: SCHEMA_NAME,
        timestamps: true,
    }
);

export const ArchiveDownloadItem = mongoose.model<ArchiveDownloadItemDocument>(
    SCHEMA_NAME,
    ArchiveDownloadItemSchema
);
