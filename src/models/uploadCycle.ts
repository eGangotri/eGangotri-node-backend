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
    collection: 'Upload_Cycle',
    timestamps: true
}
);

export const UploadCycle = mongoose.model('Upload_Cycle', schema);


