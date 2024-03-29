export interface LinkData {
    link: string;
    titleArchive: string;
    originalTitle?: string;
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
}

export interface ArchiveDataRetrievalMsg {
    scrapedMetadata:ArchiveDataRetrievalStatus[];
    numFailures:number;
    numSuccess:number;
    msg:string;
}
export interface ArchiveDataRetrievalStatus {
    archiveAcctName: string,
    archiveItemCount?: number,
    success: boolean,
    links?: LinkData[],
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
    downloads: number;
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