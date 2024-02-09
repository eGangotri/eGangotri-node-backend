import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    center: { type: String, required: true },
    lib: { type: String, required: false },
    pdfsRenamedCount: { type: Number, required: true },
    coverPagesRenamedCount: { type: Number, required: true },
    coverPagesMoved: { type: Boolean, required: true },
    dateOfReport: { type: Date, required: true },
    notes: { type: String, required: false, default:"" }
  },
  {
    collection: "Daily_QA_Work_Report",
    timestamps: true,
  }
);

export const DailyQAWorkReport = mongoose.model("Daily_QA_Work_Report", schema);
