export interface PdfStats {
    rowCounter?: number;
    fileName: string;
    pageCount?: number;
    size?: string;
    rawSize?: number;
    absPath: string;
    folder: string;
}