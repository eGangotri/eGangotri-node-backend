import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    center: { type: String, required: true },
    lib: { type: String, required: false },
    totalPdfCount: { type: Number, required: true },
    totalPageCount: { type: Number, required: true },
    totalSize: { type: String, required: true },
    totalSizeRaw: { type: Number, required: true },
    dateOfReport: { type: Date, required: true },
    pageCountStats: { type: [{
      fileName: String,
      pageCount: Number,
      fileSize: String,
      fileSizeRaw: Number,
    }], required: true },
  },
  {
    collection: "Daily_Work_Report",
    timestamps: true,
  }
);

export const DailyWorkReport = mongoose.model("Daily_Work_Report", schema);
