import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../utils/constants';
import path from 'path';
import fs from 'fs';
import { jsonToExcel } from '../cliBased/excel/ExcelUtils';
import { ItemsUshered } from '../models/itemsUshered';

export const findMissedUploads = async (uploadCycleId: string,
    allIntended: string[]) => {

    const itemsUsheredByCycleId = await ItemsUshered.find({
        uploadCycleId: uploadCycleId
    });
    const _allUshered = itemsUsheredByCycleId.map(x => {
        return {
            title: x.title,
            localPath: x.localPath,
        }
    }
    )

    const _missedForUploadCycleId = allIntended.filter(x => !_allUshered.find(y => y.localPath === x))
    console.log(`_missedForUploacCycleId ${_missedForUploadCycleId.length} ${_missedForUploadCycleId}`);
    return _missedForUploadCycleId;
}

export const createJsonFileForUpload = (uploadCycleId: string, _failedForUploacCycleId: any[], statusString: string) => {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
    const suffix = `${uploadCycleId}-${statusString}-${timeComponent}.json`;
    const jsonFileName = folder + `reupload-failed-in-upload-cycle-id-${suffix}`;
    console.log(`jsonFileName ${jsonFileName}`)
    fs.writeFileSync(jsonFileName, JSON.stringify(_failedForUploacCycleId, null, 2));
    return jsonFileName
}

export const createExcelV1FileForUpload = (uploadCycleId: string, jsonArray: any[], statusString: string) => {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
    const suffix = `${uploadCycleId}-${statusString}-${timeComponent}.xlsx`;
    const excelFileName = folder + `reupload-missed-in-upload-cycle-id-${suffix}`;
    console.log(`excelFileName ${excelFileName}`)
    jsonToExcel(jsonArray, excelFileName)

    return excelFileName
}

