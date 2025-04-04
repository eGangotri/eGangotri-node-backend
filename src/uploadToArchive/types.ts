export interface UploadConfig {
    chromePath?: string;
    timeoutInSeconds: number;
    maxUploadFailures: number;
    defaultSubjectDesc: string;
}

export interface ArchiveCredentials {
    username: string;
    password: string;
}

export interface UploadItem {
    title: string;
    path: string;
    archiveProfile: string;
    archiveItemId?: string;
    collection?: string;
    subject?: string;
}

export interface UploadResult {
    success: number;
    failures: number;
    items: {
        path: string;
        success: boolean;
        error?: string;
    }[];
}
