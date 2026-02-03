import mongoose, { Schema, Document } from 'mongoose';

export interface IAcrobatHeaderFooterRemovalPerItemHistory extends Document {
    _srcFolder: string;
    _destFolder: string;
    commonRunId: string;
    runId: string;
    success: boolean;
    logs: any;
    errorMsg: string;
    createdAt: Date;
}

const TABLE_NAME = "AcrobatHeaderFooterRemovalPerItemHistory";

const AcrobatHeaderFooterRemovalPerItemHistory: Schema = new Schema({
    _srcFolder: { type: String, required: true },
    _destFolder: { type: String, required: true },
    commonRunId: { type: String, required: true },
    runId: { type: String, required: true },
    success: { type: Boolean, required: false },
    logs: { type: Schema.Types.Mixed, required: false },
    errorMsg: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
}, { collection: TABLE_NAME });

export default mongoose.model<IAcrobatHeaderFooterRemovalPerItemHistory>(TABLE_NAME, AcrobatHeaderFooterRemovalPerItemHistory);
