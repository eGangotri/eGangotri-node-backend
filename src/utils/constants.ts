export const MAX_ITEMS_LISTABLE=1000; // 250 is a stable value. to high a valuve can cause  MongoDB query timeouts
export const DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH=1

export const FOLDER = "FOLDER"

export const DD_MM_YYYY_FORMAT = 'DD-MMM-YYYY'
export const DD_MM_YYYY_HH_MMFORMAT = 'DD-MMM-YYYY-HH-mm'

const rowCounters: { [key: string]: [number, number] } = {};

export const incrementRowCounter = (requestId: string) => {
  if (!rowCounters[requestId]) {
    rowCounters[requestId] = [1, 0];
  }
  rowCounters[requestId] = [++rowCounters[requestId][0], 0];
  return rowCounters[requestId][0];
};

export const incrementColumnCounter = (requestId: string) => {
  if (!rowCounters[requestId]) {
    rowCounters[requestId] = [1, 0];
  }
  rowCounters[requestId] = [rowCounters[requestId][0], ++rowCounters[requestId][1]];
  return rowCounters[requestId][1];
};


export const getRowCounter = (requestId: string) => {
  return rowCounters[requestId] || [1, 0];
};


export 
enum DownloadHistoryStatus {
  Queued = 'queued',
  InProgress = 'in-progress',
  Completed = 'completed',
  Failed = 'failed'
}