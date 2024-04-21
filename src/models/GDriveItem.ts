import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        serialNo: { type: String, required: true },
        titleGDrive: { type: String, required: true },
        gDriveLink: { type: String, required: true },
        truncFileLink: { type: String, required: true },
        sizeWithUnits: { type: String, required: true },
        sizeInBytes: { type: String, required: true },
        folderName: { type: String, required: true },
        createdTime: { type: String, required: true },
        source: { type: String, required: true },
        identifier: { type: String, required: true },
        identifierTruncFile: { type: String, required: true },
        thumbnail: { type: String, required: false },
        titleOriginalScript: { type: String, required: false },
        textType: { type: String, required: false },
        titleinEnglish: { type: String, required: false },
        pageCount: { type: Number, required: false },
        subTitle: { type: String, required: false },
        author: { type: String, required: false },
        editor: { type: String, required: false },
        languages: { type: String, required: false },
        script: { type: String, required: false },
        subect: { type: String, required: false },
        publisher: { type: String, required: false },
        edition: { type: String, required: false },
        placePub: { type: String, required: false },
        yearPub: { type: String, required: false },
        isbn: { type: String, required: false },
        remarks: { type: String, required: false },
        commentaries: { type: String, required: false },
        commentator: { type: String, required: false },
        series: { type: String, required: false },
    },
    {
        collection: "GDriveItem",
        timestamps: false,
    }
);
// Create a compound unique index on acct and identifier
schema.index({ identifier: 1 }, { unique: true });

export const GDriveItem = mongoose.model("GDriveItem", schema);
