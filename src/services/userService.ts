import { subDays } from "date-fns";
import { User } from "../models/user";
import { getLimit } from "../routes/utils";
import { DEFAULT_DAYS_BEFORE_CURRENT_FOR_SEARCH } from "../utils/constants";
import { UserListOptionsType } from "./types";



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
    const _username: string[] = queryOptions?.username.split(",");

    //This wil make the username case-independent
    var regexArray = _username.map(pattern => new RegExp(pattern, 'i'));
    console.log(` queryOptions?.username ${queryOptions?.username} : regexArray: ${regexArray}`)
    mongoOptionsFilter = { username: { $in: regexArray } };
    console.log(`mongoOptionsFilter ${JSON.stringify(mongoOptionsFilter)}`)
  }

  if (queryOptions?.password) {
    const _pwd: string[] = queryOptions?.password.split(",");
    mongoOptionsFilter = { ...mongoOptionsFilter, password: { $in: _pwd } };
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