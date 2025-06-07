import { Schema, model } from 'mongoose';

const folderDetailSchema = new Schema({
  folder_path: String,
  image_count: Number,
  status: String,
  folderErrors: [String],
  error_count: Number,
  pdf_generated: Boolean,
  pdf_path: String,
  skipped: Boolean,
  pdf_page_count: Number,
  pages_match_images: Boolean
});

const summarySchema = new Schema({
  folders_with_images: Number,
  pdfs_created: Number,
  pdfs_skipped: Number,
  error_count: Number,
  failed_images_count: Number,
  successful_images_count: Number,
  time_taken_seconds: Number
});

const memoryStatsSchema = new Schema({
  initial_mb: Number,
  peak_mb: Number,
  final_mb: Number,
  net_change_mb: Number
});

const pathsSchema = new Schema({
  source: String,
  destination: String
});

const imageToPdfHistorySchema = new Schema({

  total_folders: Number,
  folders_detail: [folderDetailSchema],
  summary: summarySchema,
  memory_stats: memoryStatsSchema,
  paths: pathsSchema,
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { transform: function(doc, ret) { return ret; } }
});

export const ImageToPdfHistory = model('ImageToPdfHistory', imageToPdfHistorySchema);
