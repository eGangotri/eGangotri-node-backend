import * as express from 'express';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { GoogleApiData } from 'cliBased/googleapi/types';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_TYPE_EXT } from '../imgToPdf/utils/constants';
import { FileStats } from '../imgToPdf/utils/types';


export const verifyGDriveLocalIntegrity = async (_links: string[],
    _folders: string[],
    ignoreFolder: string, fileType: string
) => {
    const startTime = Date.now();
    const gDriveFileStats = [];
    const localStats = [];

    for (let i = 0; i < _links.length; i++) {
        console.log(`getGDriveContentsAsJson ${_links[i]} ${_folders[i]} (${fileType})`)
        const googleDriveFileData: GoogleApiData[] =
            await getGDriveContentsAsJson(_links[i], "", ignoreFolder, fileType);
        gDriveFileStats.push(googleDriveFileData);

        const _stats: FileStats[] = await getAllFileStats({
            directoryPath: _folders[i],
            filterExt: fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : []),
            ignorePaths: [ignoreFolder],
            withLogs: true,
            withMetadata: true,
        });
        localStats.push(_stats)
    }
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken to retrieve google drive Listings and local file listings: ${timeInfo(timeTaken)}`);
    const comparisonResult = compareGDriveLocalJson(gDriveFileStats, localStats);
    console.log(`comparisonResult: ${JSON.stringify(comparisonResult)}`);
    return {
        timeTaken: timeInfo(timeTaken),
        response: {
            googleDriveFileData: gDriveFileStats,
            fileStats: localStats,
            comparisonResult
        }
    }
}

export const compareGDriveLocalJson =
     (googleDriveFileData: GoogleApiData[],
        localFileStats: FileStats[]) => {
        let failedFiles = [];
        const gDriveFileTotal = googleDriveFileData?.length
        const localFileTotal = localFileStats?.length;
        if (gDriveFileTotal !== localFileTotal) {
            failedFiles.push(`Length of googleDriveFileData(${gDriveFileTotal}) and localFileStats(${localFileTotal}) are not equal`
            )
        }

        for (let i = 0; i < googleDriveFileData.length; i++) {
            const gDriveItem = googleDriveFileData[i];
            const localItem = localFileStats.length > i ? localFileStats[i] : { fileName: "", rawSize: -1, absPath: "" };
            console.log(`gDriveItem: ${JSON.stringify(gDriveItem)}`);
            console.log(`localItem: ${JSON.stringify(localItem)}`);

            if (parseInt(gDriveItem?.fileSizeRaw) !== localItem.rawSize) {
                failedFiles.push(`File size mismatch: ${gDriveItem.fileName} ${localItem?.fileName}`
                )
            }
            if (localItem?.absPath?.endsWith(`${gDriveItem.parents}/${gDriveItem.fileName}`)) {
                failedFiles.push(`File name mismatch: ${gDriveItem?.fileName} ${localItem.absPath}`
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
