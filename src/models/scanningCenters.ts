import * as mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        centerName: { type: String, required: true },
        libraries: {
            type: [String], required: true
        },
    }, {
    collection: 'ScanningCenter',
    timestamps: true
}
);

export const ScanningCenter = mongoose.model('ScanningCenter', schema);


