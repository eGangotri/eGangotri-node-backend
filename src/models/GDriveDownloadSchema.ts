import mongoose, { Document, Schema } from 'mongoose';

export interface ICompositeDocument {
    fileName: string;
    filePath: string;
    status: 'queued' | 'in-progress' | 'completed' | 'failed';
    msg: string;
}

const CompositeDocumentSchema: Schema = new Schema(
    {
        fileName: { type: String, required: true },
        filePath: { type: String, required: false },
        status: { type: String, enum: ['queued', 'in-progress', 'completed', 'failed'], required: true },
        msg: { type: String, required: false },
    },
    { _id: false }
);

export interface IGDriveDownload extends Document {
    status: 'queued' | 'in-progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    msg: string;
    googleDriveLink: string;
    profileNameOrAbsPath: string;
    fileDumpFolder: string;
    downloadType: string;
    files: ICompositeDocument[];
}

const GDriveDownloadSchema: Schema = new Schema(
    {
        googleDriveLink: { type: String, required: true },
        profileNameOrAbsPath: { type: String, required: true },
        fileDumpFolder: { type: String, required: true },
        status: { type: String, enum: ['queued', 'in-progress', 'completed', 'failed'], default: 'queued' },
        msg: { type: String, required: false },
        downloadType: { type: String, required: true },
        files: { type: [CompositeDocumentSchema], required: true },
    },
    {
        timestamps: true,
        collection: 'GDriveDownload',
    }
);

const GDriveDownload = mongoose.model<IGDriveDownload>('GDriveDownload', GDriveDownloadSchema);

export default GDriveDownload;