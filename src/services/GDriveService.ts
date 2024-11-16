import * as express from 'express';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { GoogleApiData } from 'cliBased/googleapi/types';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_TYPE_EXT } from '../imgToPdf/utils/constants';
import { FileStats } from 'imgToPdf/utils/types';


export const verifyGDriveLocalIntegrity = async (_links: string[],
    _folders: string[],
    ignoreFolder: string, fileType: string
) => {
    const startTime = Date.now();
    const _resps = [];
    const _resps2 = [];

    for (let i = 0; i < _links.length; i++) {
        console.log(`getGDriveContentsAsJson ${_links[i]} ${_folders[i]} (${fileType})`)
        const googleDriveFileData: Array<GoogleApiData> =
            await getGDriveContentsAsJson(_links[i], "", ignoreFolder, fileType);
        _resps.push(googleDriveFileData);

        const localFileStats: FileStats[] = await getAllFileStats({
            directoryPath: _folders[i],
            filterExt: fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : []),
            ignorePaths: [ignoreFolder],
            withLogs: true,
            withMetadata: true,
        });
        _resps2.push(localFileStats)
    }
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken to retrieve google drive Listings and local file listings: ${timeInfo(timeTaken)}`);
    const comparisonResult = compareGDriveLocalJson(_resps, _resps2);
    return {
        timeTaken: timeInfo(timeTaken),
        response: {
            googleDriveFileData: _resps,
            fileStats: _resps2,
            comparisonResult
        }
    }
}

export const compareGDriveLocalJson =
    async (googleDriveFileData: Array<GoogleApiData>,
        localFileStats: FileStats[]) => {
        let successCount = 0;
        let failedFiles = [];
        const gDriveFileTotal = googleDriveFileData.length;
        const localFileTotal = localFileStats?.length;
        if (gDriveFileTotal !== localFileTotal) {
            failedFiles.push(`Length of googleDriveFileData(${gDriveFileTotal}) and localFileStats(${localFileTotal}) are not equal`
            )
        }

        for (let i = 0; i < googleDriveFileData.length; i++) {
            if (parseInt(googleDriveFileData[i].fileSizeRaw) !== localFileStats[i].rawSize) {
                failedFiles.push(`File size mismatch: ${googleDriveFileData[i].fileName} ${localFileStats[i].fileName}`
                )
            }
            if (localFileStats[i].absPath.endsWith(googleDriveFileData[i].fileName)) {
                failedFiles.push(`File name mismatch: ${googleDriveFileData[i].fileName} ${localFileStats[i].absPath}`
                )
            }
        }

        return {
            gDriveFileTotal,
            localFileTotal,
            success: failedFiles.length === 0,
            failedCount: failedFiles.length,
            failedFiles,
        }
    }
