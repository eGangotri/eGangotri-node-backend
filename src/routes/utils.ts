import { LoginUsersDocument, UserListOptionsType } from "../services/types";
import { getUsers } from "../services/userService";
import { MAX_ITEMS_LISTABLE } from "../utils/constants";
import { Request } from "express";

export const getLimit = (limit:string|undefined|number):number => {
    return typeof limit == 'number' ? limit :parseInt(limit|| `${MAX_ITEMS_LISTABLE}`);
}

export const stripPassword = ( users: LoginUsersDocument[]) => {
    const strippedPasswords = users.map((loginUser: LoginUsersDocument) => {
      return {
        username:loginUser.username,
        role:loginUser.role,
        password: "",
      };
    });
    return strippedPasswords?.length ? strippedPasswords: []
  }
  
export const validateUser = async (username:string,password:string) => {
  const userListOption = {
    username,
    password
  } as UserListOptionsType;
  console.log(`userListOption${JSON.stringify(userListOption)}`);
  const users: LoginUsersDocument[] = await getUsers(userListOption);
  console.log(`users:${JSON.stringify(users)}`);
  return users;
}


export const validateUserFromRequest = async (req: Request) => {
  const username = req?.body?.operatorName;
  const password = req?.body?.password;
  const _user = await validateUser(username, password);
  return _user?.length > 0
}
