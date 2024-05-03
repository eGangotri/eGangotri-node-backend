import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        archiveItemId: { type: String, required: true },
        csvName: { type: String, required: true },
        datetimeUploadStarted: { type: Date, required: true, default:Date.now },
        uploadFlag: { type: Boolean, required: false, default: null }
    }, {
        collection: 'Items_Ushered',
        timestamps:true
    }
);

export const ItemsUshered = mongoose.model('Items_Ushered', schema);


