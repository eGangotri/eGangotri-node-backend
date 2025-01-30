export const MAX_ITEMS_LISTABLE=2500
export const DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH=1


export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'

export let ROW_COUNTER = [1, 0];
export const incrementRowCounter = () => { ROW_COUNTER = [++ROW_COUNTER[0], 0] }
export const resetRowCounter = () => { ROW_COUNTER = [1, 0] }

export 
enum GDriveDownloadHistoryStatus {
  Queued = 'queued',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed'
}