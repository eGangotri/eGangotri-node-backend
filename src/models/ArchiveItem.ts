import * as mongoose from "mongoose";

interface IArchiveItem extends Document {
    link: string;
    allDownloadsLinkPage: string;
    pdfDownloadLink: string;
    pageCount: string;
    originalTitle: string;
    titleArchive: string;
    size: string;
    sizeFormatted: string;
    subject: string;
    description: string;
    date: string;
    acct: string;
    identifier: string;
    type: string;
    mediaType: string;
    emailUser: string;
    source?: string;
  }
  
const ArchiveItemSchema = new mongoose.Schema(
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
        source: { type: String, required: false },
    },
    {
        collection: "ArchiveItem",
        timestamps: true,
    }
);
// Create a compound unique index on acct and identifier
ArchiveItemSchema.index({ acct: 1, identifier: 1 }, { unique: true });
export const ArchiveItem = mongoose.model<IArchiveItem>("ArchiveItem", ArchiveItemSchema);
