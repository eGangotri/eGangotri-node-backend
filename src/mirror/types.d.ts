import { Types } from "mongoose";

export interface ArchiveProfileAndCount {
    archiveProfile: string;
    count: number;
    uploadSuccessCount ?:number;
}
export interface UploadCycleArchiveProfile {
    archiveProfile?: string;
    count?: number;
    titles?: string[];
    absolutePaths?: string[];
}

export interface ArchiveProfileAndTitle {
    archiveProfile: string;
    title: string;
}

export interface UploadCycleTypes {
    countIntended?: number;
    archiveProfileAndCountIntended?: ArchiveProfileAndCount[]; 
}

export interface UploadCycleTableData {
    uploadCycleId: string;
    archiveProfileAndCount: ArchiveProfileAndCount[];
    datetimeUploadStarted: Date;
    totalCount: number;
    mode ?: string;
    archiveProfileAndCountForQueue?: ArchiveProfileAndCount[];
    totalQueueCount?:number;
    dateTimeQueueUploadStarted?:Date;

    countIntended?: number;
    archiveProfileAndCountIntended?: ArchiveProfileAndCount[]; 
    allUploadVerified?: boolean|null;
    moveToFreeze ?: boolean;
    uploadCenter?: string;
}


export interface UploadCycleTableDataDictionary {
    uploadCycle: UploadCycleTableData;
}

export interface UploadCycleTableDataResponse {
    response: UploadCycleTableDataDictionary[]
}

export interface SelectedUploadItem {
    id:Types.ObjectId;
    archiveId:string;
    isValid?: boolean;
    title?:string
}
