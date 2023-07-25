import { User } from "../models/user";
import { getLimit } from "../routes/utils";
import { replaceQuotesAndSplit } from "./Util";
import { SUPERADMIN_ROLE } from "../mirror/FrontEndBackendCommonCodeConsts";
import { Request } from "express";
import { LoginUsersDocument, UserListOptionsType } from "../services/types";

export function setOptionsForUserListing(queryOptions: UserListOptionsType) {
  // Empty `filter` means "match all documents"
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate) {
    mongoOptionsFilter = {
      ...mongoOptionsFilter,
      createdAt: {
        $gte: new Date(queryOptions?.startDate),
        $lte: new Date(queryOptions?.endDate),
      },
    };
  }

  if (queryOptions?.username) {
    const _username: string[] = replaceQuotesAndSplit(queryOptions?.username);

    //This wil make the username case-independent
    var regexArray = _username.map(pattern => new RegExp(`^${pattern}$`, 'i'));

    console.log(` queryOptions?.username ${queryOptions?.username} : regexArray: ${regexArray}`)
    mongoOptionsFilter = { username: { $in: regexArray } };
    console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  }

  if (queryOptions?.password) {
    const _pwd: string[] = replaceQuotesAndSplit(queryOptions?.password);
    mongoOptionsFilter = { ...mongoOptionsFilter, password: { $in: _pwd } };
  }

  if (queryOptions?.role) {
    const _role: string[] = replaceQuotesAndSplit(queryOptions?.role);
    mongoOptionsFilter = { ...mongoOptionsFilter, role: { $in: _role } };
  }
  console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  const limit: number = getLimit(queryOptions?.limit);
  return { limit, mongoOptionsFilter };
}

export async function getUsers(queryOptions: UserListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForUserListing(queryOptions);
  const items = await User.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

export const userExists = async (username: string) => {
  const users = await getUsers({ username: username })
  console.log(`${users[0]} userExists`)
  return users?.length > 0;
}


export const _userExists = async (req: Request) => {
  return userExists(req?.body?.username)
}

export const validateUser = async (username: string, password: string) => {
  const userListOption = {
    username,
    password
  } as UserListOptionsType;
  console.log(`userListOption${JSON.stringify(userListOption)}/n username:${username}/password${password}`);
  const users: LoginUsersDocument[] = await getUsers(userListOption);
  console.log(`users: ${users.length} ${JSON.stringify(users)}`);
  return users;
}


export const validateUserFromRequest = async (req: Request) => {
  const username = req?.body?.operatorName;
  const password = req?.body?.password;
  const _user = await validateUser(username, password);
  return _user?.length > 0
}

export const validateSuperAdminUserFromRequest = async (req: Request) => {
  const username = req?.body?.superadmin_user;
  const password = req?.body?.superadmin_password;
  if (!username || !password) {
    return [false, "Superadmin Username or password missing"];
  }
  const _user = await validateUser(username, password);
  const users = _user.map(document => document.toObject());
  console.log(`_user${JSON.stringify(_user)}`);
  if (users?.length === 0) {
    return [false, `Login failed for User "${username}"`];
  }
  else if (users[0].role !== SUPERADMIN_ROLE) {
    return [false, `Username "${username}" doesnt have relevant privileges`];
  }
  else {
    return [true, ""];
  }

}
