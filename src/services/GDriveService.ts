import * as path from 'path';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { GoogleApiData } from 'cliBased/googleapi/types';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_TYPE_EXT } from '../imgToPdf/utils/constants';
import { FileStats } from '../imgToPdf/utils/types';

export const GDRIVE_DEFAULT_IGNORE_FOLDER = GDRIVE_DEFAULT_IGNORE_FOLDER;

export const verifyGDriveLocalIntegrity = async (_links: string[],
    _folders: string[],
    ignoreFolder: string = GDRIVE_DEFAULT_IGNORE_FOLDER,
    fileType: string
) => {
    const startTime = Date.now();
    const results = await Promise.all(
        _links.map(async (link, index) => {
            console.log(`Directory[${index}]: ${_folders[index]}`);
            console.log(`Is absolute path[${index}] ${_folders[index]}: ${path.isAbsolute(_folders[index])}`);
            console.log(`Normalized path: ${path.normalize(_folders[index])}`);
            console.log(`File type filter: ${fileType}`);
            console.log(`File extensions to look for: ${fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : [])}`);
            console.log(`Ignore folder: ${ignoreFolder}`);

            const gDriveStats = await getGDriveContentsAsJson(link, "", ignoreFolder, fileType);
            const localStats = await getAllFileStats({
                directoryPath: path.normalize(_folders[index]),
                filterExt: (fileType === PDF_TYPE || PDF_EXT.includes(fileType)) ? [PDF_EXT] : (fileType === ZIP_TYPE || ZIP_TYPE_EXT.includes(fileType) ? ZIP_TYPE_EXT : []),
                ignorePaths: [ignoreFolder],
                withLogs: true,
                withMetadata: true,
                includeFolders: false
            })

            console.log(`Found ${localStats.length} local files`);
            console.log(`Found ${gDriveStats.length} Google Drive files`);

            if (localStats.length === 0) {
                console.log(`WARNING: No local files found in directory: ${_folders[index]}`);
                console.log(`Using file type filter: ${fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : [])}`);
            }

            return {
                comparison: compareGDriveLocalJson(gDriveStats, localStats),
                gDriveStats,
                localStats,
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
            comparisonResult,
            localFileStats: results.map(r => r.localStats),
            googleDriveFileStats: results.map(r => r.gDriveStats),
        }
    };
}

export interface ComparisonResult {
    [key: string]: string[] | string | number | boolean;
    success: boolean,
    failedCount: number,
    gDriveFileTotal: number,
    localFileTotal: number,
    missedGdriveItems: string[],
    sizeMisMatchGdriveItems: string[],
    failedMsgs: string[],
    failedFiles: string[],
    successMsgs: string[],
    failedMsgsCount: number,
    failedFilesCount: number,
    successMsgsCount: number,
    missedGdriveItemsCount: number,
    sizeMisMatchGdriveItemsCount: number,
}

export const compareGDriveLocalJson = (
    googleDriveFileData: GoogleApiData[],
    localFileStats: FileStats[]
): ComparisonResult => {
    const failedMsgs: string[] = [];
    const failedFiles: string[] = [];
    const missedGdriveItems: string[] = [];
    const sizeMisMatchGdriveItems: string[] = [];
    const successMsgs: string[] = [];
    const gDriveFileTotal = googleDriveFileData?.length || 0;
    const localFileTotal = localFileStats?.length || 0;

    // Create a map of local files by filename for efficient lookup
    const localFileMap = new Map<string, FileStats[]>();
    console.log(`\n=== Local File Stats ===`);
    console.log(`Total local files found: ${localFileStats.length}`);

    localFileStats.forEach(localFile => {
        const normalizedFileName = localFile.fileName.trim();
        if (!localFileMap.has(normalizedFileName)) {
            localFileMap.set(normalizedFileName, []);
        }
        localFileMap.get(normalizedFileName).push(localFile);
    });

    console.log(`localFileMap ${localFileMap.size} ${localFileMap?.keys()}`);
    console.log(`Total Google Drive files: ${googleDriveFileData.length}`);

    // Check each Google Drive file against local files
    googleDriveFileData.forEach(gDriveItem => {
        const normalizedFileName = gDriveItem.fileName.trim();
        console.log(`\nChecking Google Drive file: ${normalizedFileName}`);
        console.log(`  Google Drive path: ${gDriveItem.parents}
                        ${normalizedFileName}`);

        const localItems = localFileMap.get(normalizedFileName);
        if (!localItems || localItems.length === 0) {
            console.log(`❌ File not found locally: ${normalizedFileName}`);
            failedMsgs.push(`File not found locally: ${normalizedFileName} (expected at ${gDriveItem.parents}/${normalizedFileName})`);
            failedFiles.push(normalizedFileName);
            missedGdriveItems.push(gDriveItem.googleDriveLink);
            return;
        }

        // Compare file sizes with all matching local files
        const gDriveSize = parseInt(gDriveItem.fileSizeRaw);
        const matchingSizeFiles = localItems.filter(localItem => localItem.rawSize === gDriveSize);

        if (matchingSizeFiles.length === 0) {
            console.log(`❌ Size mismatch for all local copies of ${normalizedFileName}`);
            localItems.forEach(localItem => {
                console.log(`  Local copy at ${localItem.folder}: ${localItem.rawSize} bytes`);
            });
            console.log(`  Google Drive size: ${gDriveSize} bytes`);
            failedMsgs.push(
                `File size mismatch: ${normalizedFileName} ` +
                `(GDrive: ${gDriveSize} bytes != Local: ${localItems.map(l => l.rawSize).join('/ ')} bytes)`
            );
            failedFiles.push(normalizedFileName);
            sizeMisMatchGdriveItems.push(gDriveItem.googleDriveLink);
        } else {
            console.log(`✅ Found ${matchingSizeFiles.length} matching copies of ${normalizedFileName}`);
            matchingSizeFiles.forEach(match => {
                console.log(`  Matching copy at: ${match.folder}`);
            });
            successMsgs.push(
                `File match: ${normalizedFileName} ` +
                `(Size: ${gDriveSize} bytes, Found in ${matchingSizeFiles.length} location(s))`
            );
        }
    });

    // Check for extra local files that don't exist in Google Drive
    const gDriveFileNames = new Set(
        googleDriveFileData.map(item => item.fileName.trim())
    );
    localFileStats.forEach(localItem => {
        const normalizedFileName = localItem.fileName.trim();
        if (!gDriveFileNames.has(normalizedFileName)) {
            console.log(`❌ Extra file found locally: ${normalizedFileName} at ${localItem.folder}`);
            failedMsgs.push(`Extra file found locally: ${localItem.folder}/${normalizedFileName}`);
            failedFiles.push(normalizedFileName);
        }
    });

    return {
        success: failedMsgs.length === 0,
        failedCount: failedMsgs.length,
        gDriveFileTotal,
        localFileTotal,
        failedMsgsCount: failedMsgs?.length || 0,
        failedFilesCount: failedFiles?.length || 0,
        successMsgsCount: successMsgs?.length || 0,
        missedGdriveItems: missedGdriveItems,
        missedGdriveItemsCount: missedGdriveItems?.length || 0,
        sizeMisMatchGdriveItems: sizeMisMatchGdriveItems,
        sizeMisMatchGdriveItemsCount: sizeMisMatchGdriveItems?.length || 0,
        failedMsgs: failedMsgs,
        failedFiles: failedFiles,
        successMsgs: successMsgs,
    };
};
