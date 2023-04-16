export type DailyWorkReportType = {
  _id: string;
  operatorName: string;
  center: string;
  lib: string;
  totalPdfCount: number;
  totalPageCount: number;
  totalSize: string;
  dateOfReport: Date;
  pageCountStats: PageCountStatsType[];
};

export type PageCountStatsType = {
  _id: string;
  fileName: string;
  pageCount: number;
  fileSize: string;
};
