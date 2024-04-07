import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        link: { type: String, required: true },
        allDownloadsLinkPage: { type: String, required: true },
        pdfDownloadLink: { type: String, required: true },
        pageCount: { type: String, required: true },
        originalTitle: { type: String, required: true },
        titleArchive: { type: String, required: true },
        size: { type: String, required: true },
        sizeFormatted: { type: String, required: true },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        date: { type: String, required: true },
        acct: { type: String, required: true },
        identifier: { type: String, required: true },
        type: { type: String, required: true },
        mediaType: { type: String, required: true },
        emailUser: { type: String, required: true },
    },
    {
        collection: "ArchiveItem",
        timestamps: true,
    }
);
// Create a compound unique index on acct and identifier
schema.index({ acct: 1, identifier: 1 }, { unique: true });
export const ArchiveItem = mongoose.model("ArchiveItem", schema);
