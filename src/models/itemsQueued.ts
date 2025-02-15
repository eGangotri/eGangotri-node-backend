import * as mongoose from 'mongoose';
const DOC_NAME = 'Items_Queued';

export interface IItemsQueued extends mongoose.Document {
    archiveProfile: string;
    uploadLink: string;
    localPath: string;
    title: string;
    uploadCycleId: string;
    csvName: string;
    datetimeUploadStarted: Date;
}

const schema = new mongoose.Schema<IItemsQueued>(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        csvName: { type: String, required: true },
        datetimeUploadStarted: { type: Date, required: true, default: Date.now }
    },
    {
        collection: DOC_NAME,
        timestamps: true
    }
);

export const ItemsQueued = mongoose.model<IItemsQueued>(DOC_NAME, schema);


