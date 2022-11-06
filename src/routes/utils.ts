import { MAX_ITEMS_LISTABLE } from "../utils/constants";

export const getLimit = (limit:string|undefined|number):number => {
    return typeof limit == 'number' ? limit :parseInt(limit|| `${MAX_ITEMS_LISTABLE}`);
}