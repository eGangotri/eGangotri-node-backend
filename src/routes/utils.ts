import { LoginUsersDocument, UserListOptionsType } from "../services/types";
import { getUsers } from "../services/userService";
import { MAX_ITEMS_LISTABLE, SUPERADMIN_ROLE } from "../utils/constants";
import { Request } from "express";

export const getLimit = (limit: string | undefined | number): number => {
  return typeof limit == 'number' ? limit : parseInt(limit || `${MAX_ITEMS_LISTABLE}`);
}

export const stripPassword = (users: LoginUsersDocument[]) => {
  const strippedPasswords = users.map((loginUser: LoginUsersDocument) => {
    return {
      username: loginUser.username,
      role: loginUser.role,
      password: "",
    };
  });
  return strippedPasswords?.length ? strippedPasswords : []
}

export const validateUser = async (username: string, password: string) => {
  const userListOption = {
    username,
    password
  } as UserListOptionsType;
  console.log(`userListOption${JSON.stringify(userListOption)}`);
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
  else if (users[0].role !== SUPERADMIN_ROLE){
    return [false, `Username "${username}" doesnt have relevant privileges`];
  }
  else {
    return [true, ""];
  }

}
