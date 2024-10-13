import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    center: { type: String, required: true },
    lib: { type: String, required: false },
    dateOfReport: { type: Date, required: true },
    pdfCount: { type: Number, required: true },
    notes: { type: String, required: false, default: "" },
    gDriveLinks: { type: [String], required: true, default: [] },
  },
  {
    collection: "GDrive_Upload_Work_Report",
    timestamps: true,
  }
);

export const GDriveUploadWorkReport = mongoose.model("GDrive_Upload_Work_Report", schema);