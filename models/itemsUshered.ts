import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        archiveItemId: { type: String, required: true },
        csvName: { type: String, required: true }
    }, {
        collection: 'Items_Ushered',
        timestamps:true
    }
);

export const ItemsUshered = mongoose.model('Items_Ushered', schema);


