// import { Schema, model } from 'mongoose';

// const folderDetailSchema = new Schema({
//   folderPath: { type: String },
//   imageCount: { type: Number },
//   status: { type: String },
//   folderErrors: { type: [String] },
//   errorCount: { type: Number },
//   pdfGenerated: { type: Boolean },
//   pdfPath: { type: String },
//   skipped: { type: Boolean },
//   pdfPageCount: { type: Number },
//   pagesMatchImages: { type: Boolean }
// });

// const summarySchema = new Schema({
//   foldersWithImages: { type: Number },
//   pdfsCreated: { type: Number },
//   pdfsSkipped: { type: Number },
//   errorCount: { type: Number },
//   failedImagesCount: { type: Number },
//   successfulImagesCount: { type: Number },
//   timeTakenSeconds: { type: Number }
// });

// const memoryStatsSchema = new Schema({
//   initialMb: { type: Number },
//   peakMb: { type: Number },
//   finalMb: { type: Number },
//   netChangeMb: { type: Number }
// });

// const pathsSchema = new Schema({
//   source: { type: String },
//   destination: { type: String }
// });

// const imageToPdfHistorySchema = new Schema({
//   totalFolders: { type: Number },
//   foldersDetail: [folderDetailSchema],
//   summary: { type: summarySchema },
//   memoryStats: { type: memoryStatsSchema },
//   paths: { type: pathsSchema },
//   createdAt: { type: Date, default: Date.now }
// }, {
//   minimize: false,
//   toJSON: {
//     getters: true,
//     transform: (doc, ret) => {
//       return ret;
//     }
//   },
//   toObject: {
//     getters: true,
//     transform: (doc, ret) => {
//       return ret;
//     }
//   }
// });

// export const ImageToPdfHistory = model('ImageToPdfHistory', imageToPdfHistorySchema);
