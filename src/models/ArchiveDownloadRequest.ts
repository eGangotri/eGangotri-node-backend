import * as mongoose from 'mongoose';

export interface IArchiveDownloadRequest {
    runId: string;
    commonRunId: string;
    excelPath?: string;
    archiveUrl?: string;
    profileOrAbsPath: string;
    status?: string;
    msg?: string;
    totalItems?: number;
    deleted?: boolean;
    verify?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ArchiveDownloadRequestDocument = IArchiveDownloadRequest & mongoose.Document;

const SCHEMA_NAME = 'ARCHIVE_DOWNLOAD_REQUEST';
const ArchiveDownloadRequestSchema = new mongoose.Schema(
    {
        runId: { type: String, required: true, index: true },
        commonRunId: { type: String, required: true, index: true },
        excelPath: { type: String, required: false },
        archiveUrl: { type: String, required: false },
        profileOrAbsPath: { type: String, required: true },
        status: { type: String, required: false, default: 'initiated' },
        msg: { type: String, required: false },
        totalItems: { type: Number, required: false, default: 0 },
        deleted: { type: Boolean, required: false, default: false },
        verify: { type: Boolean, required: false, default: false },
    },
    {
        collection: SCHEMA_NAME,
        timestamps: true,
    }
);

export const ArchiveDownloadRequest = mongoose.model<ArchiveDownloadRequestDocument>(
    SCHEMA_NAME,
    ArchiveDownloadRequestSchema
);
