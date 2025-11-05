export interface ConvertImgFolderToPdfApiResponse {
  response: ConvertImgFolderToPdfResponse;
}

export interface ConvertImgFolderToPdfResponse {
  success: boolean;
  _cumulativeMsg: string;
  result: ConvertResultItem[];
}

export interface ConvertResultItem {
  status: boolean;
  message: string;
  data: ConvertData;
}

export interface ConvertData {
  total_folders: number;
  folders_detail: FolderDetail[];
  total_folders_including_empty: number;
  summary: Summary;
  memory_stats: MemoryStats;
  mongo_doc_id: string;
  paths: Paths;
  time_taken_seconds: number;
}

export interface FolderDetail {
  folder_path: string;
  has_images: boolean;
  image_count: number;
  pdf_generated: boolean;
  pdf_path: string;
  pdf_page_count: number;
  pages_match_images: boolean;
  folderErrors: string[];
  error_count: number;
  status: string; // e.g., "success"
  skipped: boolean;
}

export interface Summary {
  folders_with_images: number;
  pdfs_created: number;
  pdfs_skipped: number;
  error_count: number;
  failed_images_count: number;
  successful_images_count: number;
  time_taken_seconds: number;
  pdf_count_matches_folders: boolean;
}

export interface MemoryStats {
  initial_mb: number;
  peak_mb: number;
  final_mb: number;
  net_change_mb: number;
}

export interface Paths {
  source: string;
  destination: string;
}