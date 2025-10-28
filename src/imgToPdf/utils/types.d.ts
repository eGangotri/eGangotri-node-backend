export interface FileStats {
    rowCounter?: number | string;
    fileName: string;
    pageCount?: number;
    size?: string;
    rawSize?: number;
    absPath: string;
    folder: string;
    ext?: string;
}

export interface FolderStats {
    fileStats: FileStats;
    pdfCount: number;
}
export interface FileStatsOptions {
    directoryPath: string,
    filterExt?: string[],
    ignorePaths?: string[],
    ignoreFolders?: boolean,
    withLogs?: boolean,
    withMetadata?: boolean,
}