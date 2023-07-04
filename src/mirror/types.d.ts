export interface ArchiveProfileAndCount {
    archiveProfile: string;
    count: number;
}

export interface UploadCycleTableData {
    uploadCycleId: string;
    archiveProfileAndCount: ArchiveProfileAndCount[];
    dateTimeUploadStarted: Date;
    totalCount: number;
}