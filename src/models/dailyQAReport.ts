import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    center: { type: String, required: true },
    lib: { type: String, required: false },
    dateOfReport: { type: Date, required: true },
    pdfsRenamedCount: { type: Number, required: true },
    coverPagesRenamedCount: { type: Number, required: true },
    coverPagesMoved: { type: Boolean, required: true },
    notes: { type: String, required: false, default:"" },
    folderNames: { type: String, required: false, default:"" },
    operatorName: { type: String, required: true }
  },
  {
    collection: "Daily_QA_Work_Report",
    timestamps: true,
  }
);

export const DailyQAWorkReport = mongoose.model("Daily_QA_Work_Report", schema);