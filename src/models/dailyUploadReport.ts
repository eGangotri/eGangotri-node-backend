import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    center: { type: String, required: true },
    lib: { type: String, required: false },
    googleLink: { type: [String], required: false },
    totalSize: { type: String, required: true },
    dateOfReport: { type: Date, required: true },
    notes: { type: String, required: false, default: "" },
  },
  {
    collection: "Daily_GDriveUpload_Report",
    timestamps: true,
  }
);

export const DailyGDriveUploadReport = mongoose.model("Daily_GDriveUpload_Report", schema);
