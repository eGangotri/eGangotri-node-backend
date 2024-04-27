import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        archiveProfile: { type: String, required: true },
        uploadLink: { type: String, required: true },
        absPath: { type: String, required: true },
        title: { type: String, required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        creator: { type: String, required: true },
        language: { type: String, required: false },
    },
    {
        collection: "ArchiveUploadEntry",
        timestamps: true,
    }
);
// Create a compound unique index on acct and identifier
schema.index({ archiveProfile: 1, absPath: 1 }, { unique: true });
export const ArchiveUploadEntry = mongoose.model("ArchiveUploadEntry", schema);
