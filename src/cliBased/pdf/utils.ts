export let DOWNLOAD_COMPLETED_COUNT = 0;
export let DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT = 0;
export let DOWNLOAD_FAILED_COUNT = 0;

export const incrementDownloadComplete = () => {
    DOWNLOAD_COMPLETED_COUNT++
}
export const incrementDownloadInError = () => {
    DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT++
}

export const incrementDownloadFailed = () => {
    DOWNLOAD_FAILED_COUNT++
}
export const resetDownloadCounters = () => {
    DOWNLOAD_COMPLETED_COUNT = 0;
    DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT = 0;
    DOWNLOAD_FAILED_COUNT = 0;
}
