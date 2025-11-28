import mongoose, { Schema, Document } from 'mongoose';

export interface IPdfPageExtractionHistory extends Document {
    _srcFolders: string[];
    _destRootFolders: string[];
    firstNPages: number;
    lastNPages: number;
    reducePdfSizeAlso: boolean;
    commonRunId: string;
    status:string;
    createdAt: Date;
}

const TABLE_NAME = "PdfPageExtractionHistory";

const PdfPageExtractionHistory: Schema = new Schema({
    _srcFolders: { type: [String], required: true },
    _destRootFolders: { type: [String], required: true },
    firstNPages: { type: Number, required: true },
    lastNPages: { type: Number, required: true },
    reducePdfSizeAlso: { type: Boolean, required: true },
    commonRunId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, required: false },
    
}, { collection: TABLE_NAME });

export default mongoose.model<IPdfPageExtractionHistory>(TABLE_NAME, PdfPageExtractionHistory);
