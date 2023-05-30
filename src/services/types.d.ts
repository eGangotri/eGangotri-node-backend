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