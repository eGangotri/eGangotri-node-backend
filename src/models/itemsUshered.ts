import * as mongoose from 'mongoose';

const DOC_NAME = 'Items_Ushered';

export interface IItemsUshered extends mongoose.Document {
    archiveProfile: string;
    uploadLink: string;
    localPath: string;
    title: string;
    uploadCycleId: string;
    archiveItemId: string;
    csvName: string;
    datetimeUploadStarted: Date;
    uploadFlag?: boolean | null;
}

const schema = new mongoose.Schema<IItemsUshered>(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        archiveItemId: { type: String, required: true },
        csvName: { type: String, required: true },
        datetimeUploadStarted: { type: Date, required: true, default: Date.now },
        uploadFlag: { type: Boolean, required: false, default: null }
    },
    {
        collection: DOC_NAME,
        timestamps: true
    }
);

// Add index for sorting optimization
schema.index({ createdAt: -1 });

export const ItemsUshered = mongoose.model<IItemsUshered>(DOC_NAME, schema);