import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        centerName: { type: String, required: true },
        libraries: {
            type: [String], required: true
        },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
        deletedBy: { type: String },
    }, {
    collection: 'ScanningCenter',
    timestamps: true
}
);

export const ScanningCenter = mongoose.model('ScanningCenter', schema);


