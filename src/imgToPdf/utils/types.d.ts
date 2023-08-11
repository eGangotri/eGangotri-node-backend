export interface FileStats {
    rowCounter?: number;
    fileName: string;
    pageCount?: number;
    size?: string;
    rawSize?: number;
    absPath: string;
    folder: string;
    ext?: string;
}