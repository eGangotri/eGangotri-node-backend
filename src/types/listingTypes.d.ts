import * as mongoose from "mongoose";
import { BOOLEAN_FOUR_STATE } from "services/ServiceUtils";
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
  page?: number,
  startDate?: string,
  endDate?: string,
  archiveProfile?: string,
  uploadCycleId?: string,
  uploadFlag?: BOOLEAN_FOUR_STATE,
};

export type UploadCycleListOptionsType = {
  ids?: string,
  limit?: number,
  archiveProfiles?: string,
  uploadCycleId?: string,
  startDate?: string,
  endDate?: string,
  deleted?: boolean,
};


export type ArchiveItemListOptionsType = {
  searchTerm?: string,
  limit?: number,
  archiveProfiles?: string,
  acct?: string,
  wordBoundary?: string,
  startDate?: string,
  endDate?: string,
};

export type GDriveItemListOptionsType = {
  searchTerm?: string,
  limit?: number,
  archiveProfiles?: string,
  source?: string,
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

export type GDriveUploadReportListOptionsType = {
  _ids?: string,
  startDate?: string,
  endDate?: string,
  dateOfReport?: string,
  operatorName?: string,
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