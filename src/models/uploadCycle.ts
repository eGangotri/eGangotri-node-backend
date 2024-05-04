import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfiles: {
            type: [{
                archiveProfile: String,
                count: Number,
                titles: {
                    type: [String],
                    required: true
                }
            }], required: true
        },
        uploadCycleId: { type: String, required: true },
        uploadCount: { type: Number, required: true },
        datetimeUploadStarted: { type: Date, required: true, default: Date.now },
        allUploadVerified: { type: Boolean, required: false, default: null }
    }, {
    collection: 'Upload_Cycle',
    timestamps: true
}
);

export const UploadCycle = mongoose.model('Upload_Cycle', schema);


