import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        csvName: { type: String, required: true },
        datetimeUploadStarted: { type: Date, required: true }
    }, {
        collection: 'Items_Queued',
        timestamps:true
    }
);

export const ItemsQueued = mongoose.model('Items_Queued', schema);


