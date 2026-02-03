import mongoose, { Schema, Document } from 'mongoose';

export interface IAcrobatHeaderFooterRemovalHistory extends Document {
    _srcFolders: string[];
    commonDest: string;
    srcFolderCount: number;
    success: boolean;
    commonRunId: string;
    status: string;
    createdAt: Date;
}

const TABLE_NAME = "AcrobatHeaderFooterRemovalHistory";

const AcrobatHeaderFooterRemovalHistory: Schema = new Schema({
    _srcFolders: { type: [String], required: true },
    commonDest: { type: String, required: true },
    srcFolderCount: { type: Number, required: true },
    success: { type: Boolean, required: true },
    commonRunId: { type: String, required: true },
    status: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
}, { collection: TABLE_NAME });

export default mongoose.model<IAcrobatHeaderFooterRemovalHistory>(TABLE_NAME, AcrobatHeaderFooterRemovalHistory);
