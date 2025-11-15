import { checkUrlValidityForUploadItems } from "../utils/utils";
import { getListOfItemsUshered } from "./itemsUsheredService";
import { SelectedUploadItem } from "../mirror/types";
import { excelToJson, jsonToExcel } from "../cliBased/excel/ExcelUtils";
import moment from "moment";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";
import { ArchiveUploadExcelProps } from "../archiveDotOrg/archive.types";
import _ from "lodash";
import path from 'path';
import { ArchiveLinkData } from "../archiveDotOrg/types";
import { Types } from "mongoose";

export const validateDateRange = (dateRange: string) => {
    const parsedDateRange: [number, number] = [0, 0]

    if (dateRange) {
        let [startDate, endDate] = [undefined, undefined];
        const dateFilters = dateRange?.includes("-");
        if (dateFilters) {
            try {
                [startDate, endDate] = dateRange.split("-");
                if (!isValidDate(startDate) || !isValidDate(endDate)) {
                    return {
                        "status": "failed",
                        "success": false,
                        "msg": `One of Start Date(${startDate})or End Date(${endDate}) not in proper format`
                    }
                }
                const _startDate = new Date(startDate + " 00:01").getTime()
                const _endDate = new Date(endDate + " 23:59").getTime()
                if (_startDate > _endDate) {
                    return {
                        "status": "failed",
                        "success": false,
                        "msg": `Start Date(${startDate}) cannot be greater than End Date(${endDate})`
                    }
                }
                parsedDateRange[0] = _startDate;
                parsedDateRange[1] = _endDate;


                return {
                    "status": "success",
                    "success": true,
                    "parsedDateRange": parsedDateRange
                }
            }
            catch (e) {
                return {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide valid date range" + e.message
                }
            }
        }
        else {
            return {
                "status": "failed",
                "success": false,
                "msg": `Invalid Date Range ${dateRange}`
            }
        }
    }
    return {
        "success": true,
    }
}

const isValidDate = (dateString: string): boolean => {

    // Check if the date string matches the format YYYY/MM/DD
    let isValidFormat = /^\d{4}\/\d{2}\/\d{2}$/.test(dateString);

    let date = new Date(dateString);

    // Check if the date is valid
    let isValidDate = !isNaN(date.getTime());

    return (isValidFormat && isValidDate)
}

export const getSuccessfullyUploadedItemsForUploadCycleId = async (pathOrUploadCycleId: string): Promise<SelectedUploadItem[]> => {
    //get all Items_Ushered for uploadCycleIdForVerification
    const itemsUshered = await getListOfItemsUshered({ uploadCycleId: pathOrUploadCycleId });
    const results: SelectedUploadItem[] = [];
    let counter = 0;
    const total = itemsUshered.length
    for (const item of itemsUshered) {
        const res = await checkUrlValidityForUploadItems({
            id: new Types.ObjectId(item._id as any),
            archiveId: `${item.archiveItemId}`,
            isValid: true,
            title: item.title
        }, counter++, total);
        console.log(`getSuccessfullyUploadedItemsForUploadCycleId ${res.isValid} ${res.archiveId}`)
        results.push(res);
    }
    console.log(`getEntriesInUploadUshered results ${results.length}/ ${itemsUshered.length}`)
    return results;
}
const amendJson = (item: ArchiveUploadExcelProps, uploadItemInMongo: SelectedUploadItem[]): ArchiveUploadExcelProps => {
    const absPath = item.absPath;
    const title = path.basename(absPath, path.extname(absPath));
    const _uploadItem = uploadItemInMongo.find(x => x.title === title);
    return {
        ...item,
        uploadedFlag: _uploadItem?.isValid || false
    }
}

export const alterExcelWithUploadedFlag = (archiveExcelPath: string, uploadItemsInMongo: SelectedUploadItem[]) => {
    //alter the excel with uploaded flag
    console.log(`alterExcelWithUploadedFlag ${archiveExcelPath} ${uploadItemsInMongo.length}`)
    let excelAsJson: ArchiveUploadExcelProps[] = excelToJson(archiveExcelPath);
    let uploadFlagMarkedCounter = 0
    const amendedExcelAsJSON: ArchiveUploadExcelProps[] = []
    for (let i = 0; i < excelAsJson.length; i++) {
        const amendedItem = amendJson(excelAsJson[i], uploadItemsInMongo)
        amendedExcelAsJSON.push(amendedItem);
        if (amendedItem.uploadedFlag) {
            uploadFlagMarkedCounter++;
        }

    }
    if (amendedExcelAsJSON.length > 0) {
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        console.log(`Combining JSON Data: ${JSON.stringify(excelAsJson?.length > 0 ? excelAsJson[0] : [])}`)
        const _dir = path.dirname(archiveExcelPath);

        const newExcelName = `${_dir}//fip-uploadables-${timeComponent}-(${uploadFlagMarkedCounter})(${excelAsJson?.length}).xlsx`;
        jsonToExcel(amendedExcelAsJSON, newExcelName);
        return {
            "itemsMarkedAsUploaded": uploadFlagMarkedCounter,
            "itemsMarkedAsNotUploaded": excelAsJson.length - uploadFlagMarkedCounter,
            "alterExcelMsg": `${archiveExcelPath} renamed to ${newExcelName}`
        }
    }
    else {
        return {
            "itemsMarkedAsUploaded": 0,
            "itemsMarkedAsNotUploaded": 0,
            "alterExcelMsg": `No items found in ${archiveExcelPath}`
        }
    }
}

function convertToArchiveLinkData(json: any): ArchiveLinkData {
    return {
        link: json["Link"],
        titleArchive: json["Title-Archive"],
        originalTitle: json["Original Title"],
        pdfPageCount: json["Page Count"],
        uniqueIdentifier: json["Identifier"],
        allFilesDownloadUrl: json["All Downloads Link Page"],
        pdfDownloadUrl: json["Pdf Download Link"],
        description: json["Description"],
        acct: json["Acct"],
        publicdate: json["Date"],
        subject: json["Subject"],
        hit_type: json["Type"],
        mediatype: json["Media Type"],
        item_size: json["Size"],
        item_size_formatted: json["Size Formatted"],
        email: json["Email-User"],
        downloads: json["Views"],
        allNames: json["All File Names"],
        allFormats: json["All Formats"]
    };
}

export const convertArchiveExcelToLinkData = (archiveExcelPath: string): ArchiveLinkData[] => {
    const excelAsJson = excelToJson(archiveExcelPath);
    console.log(`downloadArchiveItemsViaExcel: ${excelAsJson.length} 
        (${JSON.stringify(excelAsJson[0])}) items found in ${archiveExcelPath}`);

    const _linkData: ArchiveLinkData[] = excelAsJson.map(_json => convertToArchiveLinkData(_json));
    console.log(`converted to linkData: ${_linkData.length} 
         (${JSON.stringify(_linkData[0])})
        items found in ${archiveExcelPath}`);
    return _linkData;
}