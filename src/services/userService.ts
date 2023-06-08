import { User } from "../models/user";
import { getLimit } from "../routes/utils";
import { UserListOptionsType } from "./types";
import { replaceQuotesAndSplit } from "./Util";

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
    var regexArray = _username.map(pattern => new RegExp(pattern, 'i'));
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
