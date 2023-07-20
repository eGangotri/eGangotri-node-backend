export type DailyWorkReportType = {
  _id: string;
  operatorName: string;
  center: string;
  lib: string;
  totalPdfCount: number;
  totalPageCount: number;
  totalSize: string;
  totalSizeRaw: number;
  dateOfReport: Date;
  pageCountStats: PageCountStatsType[];
  notes:string;
  workFromHome:string;
};

export type PageCountStatsType = {
  fileName: string;
  pageCount: number;
  fileSize: string;
  fileSizeRaw: string;
};
