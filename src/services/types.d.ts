import * as mongoose from "mongoose";
export type LoginUser = {
  username: string,
  password: string,
  role: string,
}

export interface LoginUsersDocument extends mongoose.Document {
  username: string,
  password: string,
  role: string,
}

export type UserListOptionsType = {
  username?: string;
  password?: string;
  role?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

export type ItemsListOptionsType = {
  ids?: string,
  limit?: number,
  startDate?: string,
  endDate?: string,
  archiveProfile?: string,
  uploadCycleId?: string,
  uploadFlag?: boolean,
};

export type UploadCycleListOptionsType = {
  ids?: string,
  limit?: number,
  archiveProfiles?: string,
  uploadCycleId?: string,
  startDate?: string,
  endDate?: string,
};


export type ArchiveItemListOptionsType = {
  searchTerm?: string,
  limit?: number,
  archiveProfiles?: string,
  wordBoundary?: string,
  startDate?: string,
  endDate?: string,
};

export type GDriveItemListOptionsType = {
  searchTerm?: string,
  limit?: number,
  archiveProfiles?: string,
  wordBoundary?: string,
  startDate?: string,
  endDate?: string,
};


export type DailyWorkReportListOptionsType = {
  _id?: string,
  startDate?: string,
  endDate?: string,
  operatorName?: string,
  centers?: string,
  isLastTwoHours?: string, //true or false as string
  limit?: number,
};


export type DailyCatWorkReportListOptionsType = {
  _ids?: string,
  startDate?: string,
  endDate?: string,
  operatorName?: string,
  catalogProfile?: string,
  link?: string,
  notes?: string,
  isLastTwoHours?: string, //true or false as string
  limit?: number,
};


export type DailyQAWorkReportListOptionsType = {
  _ids?: string,
  startDate?: string,
  endDate?: string,
  operatorName?: string,
  catalogProfile?: string,
  link?: string,
  notes?: string,
  isLastTwoHours?: string, //true or false as string
  limit?: number,
};

export type ReuploadType = {
  ids?: string,
  limit?: number,
  archiveProfiles?: string,
  uploadCycleId?: string,
  localPath?: string,
  uploadLink?: string
};