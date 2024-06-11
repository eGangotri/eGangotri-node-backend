import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../utils/constants';
import path from 'path';
import fs from 'fs';
import { jsonToExcel } from '../cliBased/excel/ExcelUtils';
import { ItemsUshered } from '../models/itemsUshered';
import { UploadCycle } from '../models/uploadCycle';
import _ from 'lodash';
import { UploadCycleArchiveProfile } from 'mirror/types';
import { ExcelV1Columns } from './types';

export const findMissedUploads = async (uploadCycleId: string): Promise<UploadCycleArchiveProfile[]> => {
    const uploadCycleByCycleId = await UploadCycle.findOne({
        uploadCycleId: uploadCycleId
    });

    const allUshered = await ItemsUshered.find({
        uploadCycleId: uploadCycleId
    });

    const usheredPaths = _.groupBy(allUshered, 'archiveProfile');
    console.log(`ushereds ${allUshered.length}`)
    const _allItendedByArchiveProfile = _.groupBy(uploadCycleByCycleId?.archiveProfiles, 'archiveProfile');

    const missing: UploadCycleArchiveProfile[] = []

    for (let [key, value] of Object.entries(_allItendedByArchiveProfile)) {
        const usheredPathsForArchiveProfiles = usheredPaths[key]?.map(x => x.localPath);
        const intendedAbsPaths = value.flatMap(x => x.absolutePaths);
        const diff: string[] = _.differenceWith(intendedAbsPaths, usheredPathsForArchiveProfiles, _.isEqual);
        console.log(`diff ${key} ${diff.length}`)

        if (diff.length > 0) {
            missing.push({
                archiveProfile: key,
                absolutePaths: diff
            })
        }
    }
    console.log(`ArchiveProfiles found that have issues: ${missing.length}`)
    return missing;
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

export const createExcelV1FileForUpload = (uploadCycleId: string, jsonArray: ExcelV1Columns[], statusString: string, infix = "") => {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
    const suffix = `uploadable-v1-${uploadCycleId}-${statusString}-${timeComponent}.xlsx`;
    const excelFileName = folder + `${infix}${suffix}`;
    console.log(`excelFileName ${excelFileName}`)
    jsonToExcel(jsonArray, excelFileName)
    return excelFileName
}

export const createExcelV3FileForUpload = (uploadCycleId: string, jsonArray: any[], statusString: string) => {
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
    const suffix = `uplodable-v3-${uploadCycleId}-${statusString}-${timeComponent}.xlsx`;
    const excelFileName =`${folder}-${suffix}`;
    console.log(`excelFileName ${excelFileName}`)
    jsonToExcel(jsonArray, excelFileName)
    return excelFileName
}


