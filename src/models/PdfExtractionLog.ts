import mongoose, { Schema, Document } from 'mongoose';

export interface IPdfExtractionLog extends Document {
    _srcFolder: string[];
    _destRootFolder: string[];
    firstNPages: number;
    lastNPages: number;
    reducePdfSizeAlso: boolean;
    commonRunId: string;
    createdAt: Date;
}

const PdfExtractionLogSchema: Schema = new Schema({
    _srcFolder: { type: String, required: true },
    _destRootFolder: { type: String, required: true },
    firstNPages: { type: Number, required: true },
    lastNPages: { type: Number, required: true },
    reducePdfSizeAlso: { type: Boolean, required: true },
    commonRunId: { type: String, required: true },
    runId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'PdfExtractionLog' });

export default mongoose.model<IPdfExtractionLog>('PdfExtractionLog', PdfExtractionLogSchema);
