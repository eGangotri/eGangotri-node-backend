export interface ArchiveExcelHeaderType {
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
    allNames: string;
    allFormats: string;
}

export interface ArchiveScrapReport {
    linkData: ArchiveLinkData[];
    stats: string;
}
export interface ArchiveLinkData {
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
    allNames: string;
    allFormats: string;
    
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
    order?: string
}

// export interface Hit {
//     fields: Fields;
//     hit_type: string;
// }

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


export interface Elements {
    page_elements: PageElements;
  }
  export interface PageElements {
    uploads: Uploads;
  }
  export interface Uploads {
    hits: Hits;
    aggregations?: (null)[] | null;
  }
  export interface Hits {
    total: number;
    returned: number;
    hits?: (HitsEntity)[] | null;
  }
  export interface HitsEntity {
    index: string;
    service_backend: string;
    hit_type: string;
    fields: HitFields;
    highlight?: null;
    _score?: null;
  }
  export interface HitFields {
    identifier: string;
    title: string;
    description: string;
    subject?: (string)[] | null;
    creator?: (string)[] | null;
    collection?: (string)[] | null;
    mediatype: string;
    licenseurl: string;
    item_size: number;
    files_count: number;
    downloads: number;
    week: number;
    month: number;
    indexflag?: (string)[] | null;
    addeddate: string;
    publicdate: string;
    num_favorites?: number | null;
  }
  