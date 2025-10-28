import { LoginUsersDocument, UserListOptionsType } from "../types/listingTypes";
import { MAX_ITEMS_LISTABLE } from "../utils/constants";


export const getLimit = (limit: string | undefined | number): number => {
  if (limit === undefined) return MAX_ITEMS_LISTABLE;
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

export const GDRIVE_CP_EXTRACTED_METADATA_RES = {
  processedCount: 0,
  failureCount: 0,
  totalCount: 0
}

export const extractValue = (text: string, pattern: RegExp): string => {
  const match = text?.match(pattern);
  return match ? match[1] : 'Not found';
};

export const getNumericInBraces = (text: string): number => {
  const matches = [...(text?.matchAll(/\(([^)]+)\)/g) || [])];
  const lastInner = matches.length ? matches[matches.length - 1][1] : null;
  if (!lastInner) return 0;
  const expr = lastInner.replace(/\s+/g, '');
  // allow only digits, + and -
  if (!/^[\d+\-]+$/.test(expr)) return 0;
  // evaluate: convert subtraction to addition of negative and sum terms
  const normalized = expr.replace(/^\+/, '').replace(/-/g, '+-');
  const terms = normalized.split('+').filter(Boolean);
  const sum = terms.reduce((acc, t) => acc + (t ? parseInt(t, 10) : 0), 0);
  return isNaN(sum) ? 0 : sum;
};