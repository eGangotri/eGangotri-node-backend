export interface ArchiveProfileAndCount {
    archiveProfile: string;
    count: number;
}

export interface UploadCycleTableData {
    uploadCycleId: string;
    archiveProfileAndCount: ArchiveProfileAndCount[];
    datetimeUploadStarted: Date;
    totalCount: number;
}

export interface UploadCycleTableDataResponse {
    uploadCycle: UploadCycleTableData
}