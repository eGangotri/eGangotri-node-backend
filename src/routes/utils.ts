import { LoginUsersDocument } from "../services/types";
import { MAX_ITEMS_LISTABLE } from "../utils/constants";

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
  