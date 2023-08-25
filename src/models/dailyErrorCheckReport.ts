import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    operatorName: { type: String, required: true },
    totalPdfCount: { type: Number, required: true },
    dateOfReport: { type: Date, required: true },
    notes: { type: String, required: false, default: "" },
    pageCountStats: {
      type: [{
        fileName: String,
        noErros: Boolean,
        notes: String,
      }], required: true
    },
  },
  {
    collection: "Daily_Error_Check_Report",
    timestamps: true,
  }
);

export const DailyWorkReport = mongoose.model("Daily_Error_Check_Report", schema);
