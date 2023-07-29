export interface ArchiveProfileAndCount {
    archiveProfile: string;
    count: number;
}

export interface UploadCycleTableData {
    uploadCycleId: string;
    archiveProfileAndCount: ArchiveProfileAndCount[];
    datetimeUploadStarted: Date;
    totalCount: number;

    archiveProfileAndCountForQueue?: ArchiveProfileAndCount[];
    totalQueueCount?:number;
    dateTimeQueueUploadStarted?:Date;
}

export interface UploadCycleTableDataDictionary {
    uploadCycle: UploadCycleTableData;
}

export interface UploadCycleTableDataResponse {
    response: UploadCycleTableDataDictionary[]
}

export interface SelectedUploadItem {
    id:number;
    archiveId:string;
    isValid?: boolean;
}