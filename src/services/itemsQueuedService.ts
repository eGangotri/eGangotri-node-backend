import { ItemsQueued } from "../models/itemsQueued";
import { setOptionsForItemListing } from "./dbService";
import { ItemsListOptionsType } from "../types/listingTypes";
import * as _ from 'lodash';

export async function getListOfItemsQueued(queryOptions: ItemsListOptionsType) {
    const {limit,mongoOptionsFilter} = setOptionsForItemListing(queryOptions)
    const items = await ItemsQueued.find(mongoOptionsFilter)
      .sort({ createdAt: -1 })
      .limit(limit);
    return items;
  }

  
export async function getListOfItemsQueuedArrangedByProfile(
    queryOptions: ItemsListOptionsType
  ) {
    const items = await getListOfItemsQueued(queryOptions);
    const groupedItems = _.groupBy(items, function (item: any) {
      return item.archiveProfile;
    });
    console.log(
      `getListOfItemsQueuedArrangedByProfile ${JSON.stringify(
        groupedItems.length
      )}`
    );
    return groupedItems;
  }
  