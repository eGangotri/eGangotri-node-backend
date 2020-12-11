import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        archivePath: { type: String, required: true },
        title: { type: String, required: true }
    }, {
        collection: 'Items_Queued'
    }
);

export const ItemsQueued = mongoose.model('Items_Queued', schema);


