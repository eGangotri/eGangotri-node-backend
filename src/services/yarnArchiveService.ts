import { checkUrlValidityForUploadItems } from "../utils/utils";
import { getListOfItemsUshered } from "./itemsUsheredService";
import { SelectedUploadItem } from "../mirror/types";
import { FipExcelThree } from "_adHoc/fip/utils";
import { excelToJson } from "cliBased/excel/ExcelUtils";

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
        "status": "success",
        "success": true,
        "parsedDateRange": parsedDateRange
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
    for (const item of itemsUshered.splice(495, 5)) {
        const res = await checkUrlValidityForUploadItems({
            id: item._id,
            archiveId: `${item.archiveItemId}`,
            isValid: true
        });
        console.log(`getSuccessfullyUploadedItemsForUploadCycleId ${res.isValid} ${res.archiveId}`)
        results.push(res);
    }
    console.log(`getEntriesInUploadUshered results ${results.length}/ ${itemsUshered.length}`)
    return results;
}

const amendJson = (item: FipExcelThree) => {
    console.log(`item ${JSON.stringify(item)}`)
    console.log(item.absPath)
    console.log(item.title)
    if (item.title) {
        counter++
        const splitFilename = item.absPath.split("-")
        const _newFileNam = `${splitFilename[0]} ${(item.title.length <= 120) ? item.title : item.title.substring(0, 120)} - ${splitFilename[1]}`
        console.log(`_newFileNam ${_newFileNam}`)
        if (fs.existsSync(_newFileNam)) {
            console.log(`File exists ${item.absPath}. renaming to ${item.absPath}_ignore`);
        }
        else if (fs.existsSync(item.absPath)) {
            try {
                fs.renameSync(item.absPath, _newFileNam);
                console.log(`File renamed to ${_newFileNam}`)
            }
            catch (e) {
                failureCount++
                console.log(`Error renaming file ${item.absPath} to ${_newFileNam} ${e} ${failureCount}`)
            }
        }
        item.absPath = _newFileNam

    }
}


export const alterExcelWithUploadedFlag = (archiveExcelPath: string, _resp: SelectedUploadItem[]) => {
    //alter the excel with uploaded flag
    console.log(`alterExcelWithUploadedFlag ${archiveExcelPath} ${_resp.length}`)
    let excelAsJson: FipExcelThree[] = excelToJson(archiveExcelPath);

    excelAsJson.forEach(x => _rename(x));
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

    console.log(`Combining JSON Data: ${JSON.stringify(combinedExcel.splice(0, 1))}`)
    jsonToExcel(combinedExcel, `${base}//fip-uploadables-${timeComponent}-(${counter})(${combinedExcel.length}).xlsx`)
}