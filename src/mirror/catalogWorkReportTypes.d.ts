//repetition of code: use monorepo
export interface DailyCatalogWorkReportType {
  _id?: string;
  title: string;
  operatorName: string;
  catalogProfile: string;
  entryFrom: number;
  entryTo: number;
  entryCount: number;
  timeOfRequest: Date;
  link: string;
  notes: string
}

