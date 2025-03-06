import * as express from 'express';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { GoogleApiData } from 'cliBased/googleapi/types';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_TYPE_EXT } from '../imgToPdf/utils/constants';
import { FileStats } from '../imgToPdf/utils/types';
import { FOLDER } from '../utils/constants';

export const verifyGDriveLocalIntegrity = async (_links: string[],
    _folders: string[],
    ignoreFolder: string, fileType: string
) => {
    const startTime = Date.now();

    const results = await Promise.all(
        _links.map(async (link, index) => {
            console.log(`getGDriveContentsAsJson ${link} ${_folders[index]} (${fileType})`);
            
            const [gDriveStats, localStats] = await Promise.all([
                getGDriveContentsAsJson(link, "", ignoreFolder, fileType),
                getAllFileStats({
                    directoryPath: _folders[index],
                    filterExt: fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : []),
                    ignorePaths: [ignoreFolder],
                    withLogs: true,
                    withMetadata: true,
                    includeFolders: false
                })
            ]);

            return {
                gDriveStats,
                localStats,
                comparison: compareGDriveLocalJson(gDriveStats, localStats)
            };
        })
    );

    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Time taken to retrieve google drive Listings and local file listings: ${timeInfo(timeTaken)}`);
    
    const comparisonResult = results.map(r => r.comparison);
    console.log(`comparisonResult: ${JSON.stringify(comparisonResult)}`);
    
    return {
        timeTaken: timeInfo(timeTaken),
        response: {
            fileStats: results.map(r => r.localStats),
            comparisonResult,
            googleDriveFileData: results.map(r => r.gDriveStats),
        }
    };
}

export interface ComparisonResult {
    success: boolean;
    failedCount: number;
    failedMsgs: string[];
    failedFiles: string[];
    successMsgs: string[];
    gDriveFileTotal: number;
    localFileTotal: number;
}

export const compareGDriveLocalJson = (
    googleDriveFileData: GoogleApiData[],
    localFileStats: FileStats[]
): ComparisonResult => {
    const failedMsgs: string[] = [];
    const failedFiles: string[] = [];
    const successMsgs: string[] = [];
    const gDriveFileTotal = googleDriveFileData?.length || 0;
    const localFileTotal = localFileStats?.length || 0;

    // Create a map of local files by their path for efficient lookup
    const localFileMap = new Map<string, FileStats>();
    localFileStats.forEach(localFile => {
        const pathKey = `${localFile.folder}/${localFile.fileName}`;
        localFileMap.set(pathKey, localFile);
    });
    console.log(`localFileMap: ${JSON.stringify(localFileMap)}`);
    // Check each Google Drive file against local files
    googleDriveFileData.forEach(gDriveItem => {
        const expectedLocalPath = `${gDriveItem.parents}/${gDriveItem.fileName}`;
        const localItem = localFileMap.get(expectedLocalPath);
        if (!localItem) {
            failedMsgs.push(`File not found locally: ${gDriveItem.fileName} (expected at ${expectedLocalPath})`);
            failedFiles.push(gDriveItem.fileName);
            return;
        }

        // Compare file sizes
        const gDriveSize = parseInt(gDriveItem.fileSizeRaw);
        if (gDriveSize !== localItem.rawSize) {
            failedMsgs.push(
                `File size mismatch: ${gDriveItem.fileName} ` +
                `(GDrive: ${gDriveSize} bytes, Local: ${localItem.rawSize} bytes)`
            );
            failedFiles.push(gDriveItem.fileName);
        } else {
            successMsgs.push(
                `File match: ${gDriveItem.fileName} ` +
                `(Size: ${gDriveSize} bytes, Path: ${expectedLocalPath})`
            );
        }
    });

    // Check for extra local files that don't exist in Google Drive
    const gDrivePathSet = new Set(
        googleDriveFileData.map(item => `${item.parents}/${item.fileName}`)
    );
    localFileStats.forEach(localItem => {
        const localPath = `${localItem.folder}/${localItem.fileName}`;
        if (!gDrivePathSet.has(localPath)) {
            failedMsgs.push(`Extra file found locally: ${localPath}`);
            failedFiles.push(localItem.fileName);
        }
    });

    return {
        success: failedMsgs.length === 0,
        failedCount: failedMsgs.length,
        failedMsgs,
        failedFiles,
        successMsgs,
        gDriveFileTotal,
        localFileTotal
    };
};
