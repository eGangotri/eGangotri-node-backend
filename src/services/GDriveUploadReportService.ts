import moment from 'moment';
import * as _ from 'lodash';

import { GDriveUploadReportListOptionsType } from "../types/listingTypes";
import { getLimit } from "../routes/utils";

import { getDateTwoHoursBeforeNow, replaceQuotes, replaceQuotesAndSplit } from "../excelToMongo/Util";
import { GDriveUploadWorkReport } from "../models/gDriveUploadWorkReport";

export function setOptionsForGDriveUploadReportListing(queryOptions: GDriveUploadReportListOptionsType) {
  // Empty `filter` means "match all documents"
  // mongoOptionsFilter: {"dateOfReport":{"$gte":"2023-06-22T18:30:00.000Z","$lte":"2023-06-24T18:29:59.000Z"}}
  let mongoOptionsFilter = {};
  if (queryOptions?.startDate && queryOptions?.endDate && moment(queryOptions?.startDate).isValid() && moment(queryOptions?.endDate).isValid()) {
    const startDateWithTimeComponent = new Date(replaceQuotes(queryOptions?.startDate) + " 00:00:00");
    const endDateWithTimeComponent = new Date(replaceQuotes(queryOptions?.endDate) + " 23:59:59");
    console.log(`endDateWithTimeComponent ${endDateWithTimeComponent}  ${new Date()}`)
    mongoOptionsFilter = {
      createdAt: {
        $gte: startDateWithTimeComponent,
        $lte: endDateWithTimeComponent,
      },
    };
  }

  if (queryOptions?.operatorName) {
    const operatorName: string[] = replaceQuotesAndSplit(queryOptions.operatorName)
    //This wil make the operatorName case-independent
    var regexArray = operatorName.map(pattern => new RegExp(`^${pattern}$`, 'i'));
    mongoOptionsFilter = { ...mongoOptionsFilter, operatorName: { $in: regexArray } };
  }

  if (queryOptions?._ids) {
    const _id: string[] = replaceQuotesAndSplit(queryOptions._ids);
    mongoOptionsFilter = { ...mongoOptionsFilter, _id: { $in: _id } };
  }

  if (queryOptions?.isLastTwoHours) {
    const isLastTwoHours = replaceQuotes(queryOptions.isLastTwoHours);
    if (isLastTwoHours === 'true') {
      mongoOptionsFilter = {
        ...mongoOptionsFilter,
        createdAt: {
          $gte: new Date(getDateTwoHoursBeforeNow()),
          $lte: new Date(new Date()),
        },
      };
    }
  }

  const limit: number = getLimit(queryOptions?.limit);
  console.log(`mongoOptionsFilter: ${JSON.stringify(mongoOptionsFilter)}`)
  console.log(`User dispatched queryOptions ${JSON.stringify(queryOptions)}`)
  return { limit, mongoOptionsFilter };
}

export async function getListOfGDriveUploadReport(queryOptions: GDriveUploadReportListOptionsType) {
  const { limit, mongoOptionsFilter } = setOptionsForGDriveUploadReportListing(queryOptions)

  const items = await GDriveUploadWorkReport.find(mongoOptionsFilter)
    .sort({ createdAt: -1 })
    .limit(limit);
  return items;
}

