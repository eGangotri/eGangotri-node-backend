import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        archiveProfiles: {
            type: [{
                archiveProfile: String,
                archiveProfilePath: String,
                count: Number,
                absolutePaths: {
                    type: [String],
                    required: true
                },
            }], required: true
        },
        uploadCycleId: { type: String, required: true },
        uploadCount: { type: Number, required: true },
        datetimeUploadStarted: { type: Date, required: true, default: Date.now },
        allUploadVerified: { type: Boolean, required: false, default: null },
        mode: { type: String, required: false, default: "Regular" },
        moveToFreeze: { type: Boolean, required: true, default: false },
        deleted: { type: Boolean, required: false, default: false }
    }, {
    collection: 'Upload_Cycle',
    timestamps: true
}
);

export const UploadCycle = mongoose.model('Upload_Cycle', schema);


