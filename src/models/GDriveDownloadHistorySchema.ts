import mongoose, { Document, Schema } from 'mongoose';
import { GDriveDownloadHistoryStatus } from '../utils/constants';

export interface ICompositeDocument {
    fileName: string;
    filePath: string;
    status: GDriveDownloadHistoryStatus;
    msg: string;
}

export interface QuickStatus {
    status?: string;
    success_count?: number|string;
    error_count?: number|string;
    dl_wrong_size_count?: string;
    totalPdfsToDownload?: number|string;
    error?:string
}

const CompositeDocumentSchema: Schema = new Schema(
    {
        fileName: { type: String, required: true },
        filePath: { type: String, required: false },
        status: { type: String, enum: Object.values(GDriveDownloadHistoryStatus), required: true },
        msg: { type: String, required: false },
    },
    { _id: false }
);

export interface IGDriveDownload extends Document {
    status: GDriveDownloadHistoryStatus;
    createdAt: Date;
    updatedAt: Date;
    msg: string;
    googleDriveLink: string;
    profileNameOrAbsPath: string;
    fileDumpFolder: string;
    gDriveRootFolder: string;
    downloadType: string;
    files: ICompositeDocument[];
    quickStatus: QuickStatus;
    verify: boolean;    
}

const QuickStatusSchema: Schema = new Schema(
    {
        status: { type: String, required: true },
        success_count: { type: Number, required: true },
        dl_wrong_size_count: { type: Number, required: true },
        error_count: { type: Number, required: true },
        totalPdfsToDownload: { type: Number, required: true },
    },
    { _id: false }
);

const GDriveDownloadHistorySchema: Schema = new Schema(
    {
        googleDriveLink: { type: String, required: true },
        profileNameOrAbsPath: { type: String, required: true },
        fileDumpFolder: { type: String, required: true },
        gDriveRootFolder: { type: String, required: false },
        status: { type: String, enum: Object.values(GDriveDownloadHistoryStatus), default: 'queued' },
        msg: { type: String, required: false },
        downloadType: { type: String, required: true },
        files: { type: [CompositeDocumentSchema], required: true },
        quickStatus: { type: QuickStatusSchema, required: false },
        verify: { type: Boolean, required: false },
    },
    {
        timestamps: true,
        collection: 'GDriveDownloadHistory',
    }
);

const GDriveDownload = mongoose.model<IGDriveDownload>('GDriveDownloadHistory', GDriveDownloadHistorySchema);

export default GDriveDownload;