import mongoose, { Schema, Document } from 'mongoose';

// Interface for folder info
interface IFolderInfo {
    folder_path: string;
    has_images: boolean;
    image_count: number;
    pdf_generated: boolean;
    pdf_path: string;
    pdf_page_count: number;
    pages_match_images: boolean;
    folderErrors: string[];
    error_count: number;
    status: string;
}

// Interface for memory stats
interface IMemoryStats {
    initial_mb: number;
    peak_mb: number;
    final_mb: number;
    net_change_mb: number;
}

// Interface for paths
interface IPaths {
    source: string;
    destination: string;
}

// Interface for summary
interface ISummary {
    folders_with_images: number;
    pdfs_created: number;
    pdfs_skipped: number;
    error_count: number;
    failed_images_count: number;
    successful_images_count: number;
    time_taken_seconds: number;
}

// Main interface for the Image to PDF History document
export interface IImageToPdfHistory extends Document {
    total_folders: number;
    folders_detail: IFolderInfo[];
    summary: ISummary;
    memory_stats: IMemoryStats;
    mongo_doc_id?: string;
    paths: IPaths;
    createdAt?: Date;
    updatedAt?: Date;
}

// Schema for folder info
const FolderInfoSchema = new Schema<IFolderInfo>({
    folder_path: { type: String, required: true },
    has_images: { type: Boolean, default: false },
    image_count: { type: Number, default: 0 },
    pdf_generated: { type: Boolean, default: false },
    pdf_path: { type: String, default: '' },
    pdf_page_count: { type: Number, default: 0 },
    pages_match_images: { type: Boolean, default: false },
    folderErrors: [{ type: String }],
    error_count: { type: Number, default: 0 },
    status: { type: String, default: 'pending' }
});

// Main schema for Image to PDF History
const ImageToPdfHistorySchema = new Schema<IImageToPdfHistory>({
    total_folders: { type: Number, default: 0 },
    folders_detail: [FolderInfoSchema],
    summary: new Schema<ISummary>({
        folders_with_images: { type: Number, default: 0 },
        pdfs_created: { type: Number, default: 0 },
        pdfs_skipped: { type: Number, default: 0 },
        error_count: { type: Number, default: 0 },
        failed_images_count: { type: Number, default: 0 },
        successful_images_count: { type: Number, default: 0 },
        time_taken_seconds: { type: Number, default: 0 }
    }),
    memory_stats: new Schema<IMemoryStats>({
        initial_mb: { type: Number, required: true },
        peak_mb: { type: Number, required: true },
        final_mb: { type: Number, default: 0 },
        net_change_mb: { type: Number, default: 0 }
    }),
    mongo_doc_id: { type: String },
    paths: new Schema<IPaths>({
        source: { type: String, required: true },
        destination: { type: String, required: true }
    })
}, { timestamps: true });

export const ImageToPdfHistory = mongoose.model<IImageToPdfHistory>('ImageToPdfHistory', ImageToPdfHistorySchema);
