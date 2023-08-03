import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        localPath: { type: String, required: true },
        title: { type: String, required: true },
        uploadCycleId: { type: String, required: true },
        archiveItemId: { type: String, required: true },
        processed: { type: Boolean, required: true },
        datetimeReUploadStarted: { type: Date, required: true }
    }, {
        collection: 'Items_Requested_For_Repupload',
        timestamps:true
    }
);

export const ItemsRequestedForRepupload = mongoose.model('Items_Requested_For_Repupload', schema);


