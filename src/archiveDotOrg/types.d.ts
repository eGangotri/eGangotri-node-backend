export interface ExcelHeaderType {
    serialNo: string;
    link: string;
    allDwnldsLink: string;
    pdfDwnldLink: string;
    originalTitle: string;
    pageCount: string;
    titleArchive: string;
    size: string;
    sizeFormatted: string;
    views: string;
    subject: string;
    description: string;
    date: string;
    acct: string;
    identifier: string;
    type: string;
    mediaType: string;
    emailUser: string;
}

export interface ArchiveScrapReport {
    linkData: LinkData[];
    stats: string;
}
export interface LinkData {
    link: string;
    titleArchive: string;
    originalTitle?: string;
    pdfPageCount?: number;
    uniqueIdentifier: string;
    allFilesDownloadUrl: string;
    pdfDownloadUrl?: string;
    description: string;
    acct: string;
    publicdate?: string;
    subject?: string;
    hit_type: string;
    mediatype: string;
    item_size: number;
    item_size_formatted: string;
    email: string;
    downloads: string;
}

export interface ArchiveDataRetrievalMsg {
    scrapedMetadata?: ArchiveDataRetrievalStatus[];
    numFailures: number;
    numSuccess: number;
    msg: string | object;
}
export interface ArchiveDataRetrievalStatus {
    archiveAcctName: string,
    archiveItemCount?: number,
    success: boolean,
    archiveReport?: ArchiveScrapReport,
    excelPath?: string,
    error?: string,
}

export interface Hit {
    fields: Fields;
    hit_type: string;
}

export interface Fields {
    identifier: string;
    title: string;
    mediatype: string;
    description: string;
    subject: string[];
    creator: string[];
    licenseurl: string;
    item_size: number;
    files_count: number;
    downloads: string;
    week: number;
    month: number;
    addeddate: Date;
    publicdate: Date;
    num_favorites?: number;
    num_reviews?: number;
    avg_rating?: number;
    reviewdate?: Date;
}

export interface ArchiveRes {
    version: string;
    session_context: SessionContext;
    response: Response;
}

export interface SessionContext {
    username: string;
}