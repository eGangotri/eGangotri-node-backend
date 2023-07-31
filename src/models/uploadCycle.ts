import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfiles: {
            type: [{
                profileName: String,
                count: Number,
            }], required: true
        },
        uploadCycleId: { type: String, required: true },
        uploadCount: { type: Number, required: true },
        datetimeUploadStarted: { type: Date, required: true }
    }, {
    collection: 'Items_Ushered',
    timestamps: true
}
);

export const ItemsUshered = mongoose.model('Items_Ushered', schema);


