import * as mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    operatorName: { type: String, required: true },
    catalogProfile: { type: String, required: true },
    entryFrom: { type: Number, required: true },
    entryTo: { type: Number, required: true },
    entryCount: { type: String, required: true },
    timeOfRequest: { type: Date, required: true },
    link: { type: String, required: false },
    notes: { type: String, required: false },
  },
  {
    collection: "Daily_Cat_Work_Report",
    timestamps: true,
  }
);

export const DailyCatWorkReport = mongoose.model("Daily_Cat_Work_Report", schema);
