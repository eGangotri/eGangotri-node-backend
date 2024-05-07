import * as mongoose from "mongoose";
import { LoginUser, LoginUsersDocument } from "../types/listingTypes";



const schema = new mongoose.Schema<LoginUser>(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
  },
  {
    collection: "User",
    timestamps: true,
  }
);

export const User = mongoose.model<LoginUsersDocument>("User", schema);
