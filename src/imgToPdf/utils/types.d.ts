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

export interface FileStatsOptions {
    directoryPath: string,
    filterPath?: string,
    ignoreFolders?: boolean,
    withLogs?: boolean,
    withMetadata?: boolean,
}