import { ItemsUshered } from "../models/itemsUshered";
import { setOptionsForItemListing } from "./dbService";
import { ItemsListOptionsType } from "./types";

export async function getListOfItemsUshered(queryOptions: ItemsListOptionsType) {
    const {limit,mongoOptionsFilter} = setOptionsForItemListing(queryOptions)
    const items = await ItemsUshered.find(mongoOptionsFilter)
      .sort({ createdAt: -1 })
      .limit(limit);
    return items;
  }
  
  