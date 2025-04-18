import * as path from 'path';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { getGDriveContentsAsJson } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { GoogleApiData, GoogleApiDataWithLocalData } from 'cliBased/googleapi/types';
import { getAllFileStats, getSingleFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT, ZIP_TYPE_EXT } from '../imgToPdf/utils/constants';
import { FileStats } from '../imgToPdf/utils/types';
import * as fsPromise from 'fs/promises';

export const GDRIVE_DEFAULT_IGNORE_FOLDER = "proc";

export const verifyGDriveLocalIntegirtyPerLink = async (gDriveLink:string, 
    folderWithRoot:string, ignoreFolder:string, fileType:string,
    sizeOnly:boolean) => {
        const _folderWithRoot = path.normalize(folderWithRoot);
        console.log(`Directory: ${_folderWithRoot}`);
        console.log(`Is absolute path ${_folderWithRoot}: ${path.isAbsolute(_folderWithRoot)}`);
        console.log(`File type filter: ${fileType}`);
        console.log(`File extensions to look for: ${fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : [])}`);
        console.log(`Ignore folder: ${ignoreFolder}`);

        const gDriveStats: GoogleApiDataWithLocalData[] = await getGDriveContentsAsJson(gDriveLink, "", ignoreFolder, fileType);
        console.log(`gDriveStats ${gDriveStats.length}`);

        let localStats: FileStats[] = [];
        try {
            const stats = await fsPromise.stat(_folderWithRoot);
            localStats = stats.isDirectory() ? await getAllFileStats({
                directoryPath: path.normalize(_folderWithRoot),
                filterExt: (fileType === PDF_TYPE || PDF_EXT.includes(fileType)) ? [PDF_EXT] : (fileType === ZIP_TYPE || ZIP_TYPE_EXT.includes(fileType) ? ZIP_TYPE_EXT : []),
                ignorePaths: [ignoreFolder],
                withLogs: true,
                withMetadata: true,
                includeFolders: false
            }) : await getSingleFileStats(_folderWithRoot, false);
        } catch (err) {
            console.log(`WARNING: Could not access path ${_folderWithRoot}: ${err.message}`);
            if (err.code === 'ENOENT') {
                console.log(`Directory/file does not exist: ${_folderWithRoot}`);
            }
        }

        console.log(`Found ${localStats.length} local files`);
        console.log(`Found ${gDriveStats.length} Google Drive files`);

        if (localStats.length === 0) {
            console.log(`WARNING: No local files found in directory: ${_folderWithRoot}`);
            console.log(`Using file type filter: ${fileType === PDF_TYPE ? [PDF_EXT] : (fileType === ZIP_TYPE ? ZIP_TYPE_EXT : [])}`);
        }

        return {
            comparison: sizeOnly ? compareGDriveLocalJsonBySize(gDriveStats, localStats) : compareGDriveLocalJson(gDriveStats, localStats, _folderWithRoot),
            gDriveStats,
            localStats,
        };
}

export const verifyGDriveLocalIntegrity = async (_links: string[],
    foldersWithRoot2: string[],
    ignoreFolder: string = GDRIVE_DEFAULT_IGNORE_FOLDER,
    fileType: string,
    sizeOnly: boolean = false
) => {
    const startTime = Date.now();
    const verificationPromises = _links.map(async (link, index) => {
        return verifyGDriveLocalIntegirtyPerLink(link, foldersWithRoot2[index], ignoreFolder, fileType, sizeOnly);
    });

    const results = await Promise.all(verificationPromises);

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

export const compareGDriveLocalJsonBySize = (
    googleDriveFileData: GoogleApiDataWithLocalData[],
    localFileStats: FileStats[]
): ComparisonResult => {
    const failedMsgs: string[] = [];
    const failedFiles: string[] = [];
    const successMsgs: string[] = [];
    const missedGdriveItems: string[] = [];
    const sizeMisMatchGdriveItems: string[] = [];

    const gDriveFileTotal = googleDriveFileData.length;
    const localFileTotal = localFileStats.length;

    // Create arrays of just the sizes
    const gDriveSizes = googleDriveFileData.map(file => parseInt(file.fileSizeRaw)).sort((a, b) => a - b);
    const localSizes = localFileStats.map(file => file.rawSize).sort((a, b) => a - b);

    // Compare sizes arrays
    const sizeMap = new Map<number, number>();
    
    // Count occurrences of each size in local files
    localSizes.forEach(size => {
        sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
    });

    // Compare with GDrive files
    googleDriveFileData.forEach(gDriveItem => {
        const gDriveSize = parseInt(gDriveItem.fileSizeRaw);
        
        if (sizeMap.has(gDriveSize) && sizeMap.get(gDriveSize)! > 0) {
            // Found a matching size
            successMsgs.push(`Found size match: ${gDriveSize} bytes`);
            sizeMap.set(gDriveSize, sizeMap.get(gDriveSize)! - 1);
            gDriveItem.success = true;
        } else {
            // No matching size found
            failedMsgs.push(`No matching size found for file of ${gDriveSize} bytes`);
            sizeMisMatchGdriveItems.push(gDriveItem.googleDriveLink);
            gDriveItem.success = false;
        }
    });

    // Check for extra local files
    sizeMap.forEach((count, size) => {
        if (count > 0) {
            failedMsgs.push(`Extra local file(s) found with size: ${size} bytes`);
        }
    });

    return {
        success: failedMsgs.length === 0,
        failedCount: failedMsgs.length,
        gDriveFileTotal,
        localFileTotal,
        failedMsgsCount: failedMsgs.length,
        failedFilesCount: failedFiles.length,
        successMsgsCount: successMsgs.length,
        missedGdriveItems,
        missedGdriveItemsCount: missedGdriveItems.length,
        sizeMisMatchGdriveItems,
        sizeMisMatchGdriveItemsCount: sizeMisMatchGdriveItems.length,
        failedMsgs,
        failedFiles,
        successMsgs
    };
};

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
    googleDriveFileData: GoogleApiDataWithLocalData[],
    localFileStats: FileStats[],
    folderWithRoot: string
): ComparisonResult => {
    const failedMsgs: string[] = [];
    const failedFiles: string[] = [];
    const missedGdriveItems: string[] = [];
    const sizeMisMatchGdriveItems: string[] = [];
    const successMsgs: string[] = [];
    const gDriveFileTotal = googleDriveFileData?.length || 0;
    const localFileTotal = localFileStats?.length || 0;

    console.log(`\n=== Local File Stats ===`);
    console.log(`Total local files found: ${localFileStats.length}`);
    console.log(`Total Google Drive files: ${googleDriveFileData.length}`);
    const folderWithRootNormalized = path.normalize(folderWithRoot);

    // Check each Google Drive file against local files
    googleDriveFileData.forEach(gDriveItem => {
        const normalizedFileName = gDriveItem.fileName.trim();
        const rootFolderName = path.basename(folderWithRootNormalized);
        const relativePath = gDriveItem.parents.startsWith(`${rootFolderName}`)
            ? gDriveItem.parents.substring(rootFolderName.length + 1)
            : gDriveItem.parents;

        const localItemTentativeLocation = path.join(folderWithRootNormalized, relativePath, normalizedFileName);
        gDriveItem.localAbsPath = localItemTentativeLocation;
        console.log(`\nChecking Google Drive file: ${normalizedFileName}`);
        console.log(`  Google Drive path: ${gDriveItem.parents}
            ${localItemTentativeLocation}
                        ${normalizedFileName}`);

        const localItem = localFileStats.find(localFile => localFile.absPath.trim() === localItemTentativeLocation);

        console.log(`gDriveItem.localAbsPath: ${gDriveItem.localAbsPath}`);
        if (!localItem) {
            console.log(`❌ File not found locally: ${normalizedFileName}`);
            failedMsgs.push(`File not found locally: ${normalizedFileName} (expected at ${gDriveItem.parents}/${normalizedFileName})`);
            failedFiles.push(normalizedFileName);
            missedGdriveItems.push(gDriveItem.googleDriveLink);
            gDriveItem.success = false;
            return;
        }

        // First try to find an exact match by full path and size
        const gDriveSize = parseInt(gDriveItem.fileSizeRaw);
        const exactPathMatch = localItem.rawSize === gDriveSize;

        if (exactPathMatch) {
            // Found exact match in both path and size
            console.log(`✅ Found exact match for ${normalizedFileName} at ${localItemTentativeLocation}`);
            successMsgs.push(
                `Exact match: ${normalizedFileName} ` +
                `(Size: ${gDriveSize} bytes, Location: ${localItemTentativeLocation})`
            );
            gDriveItem.success = true;
            return;
        }


        else {
            console.log(`❌ Size mismatch for  ${localItemTentativeLocation}`);
            console.log(`  Google Drive size: ${gDriveSize} bytes`);
            failedMsgs.push(
                `File size mismatch: ${normalizedFileName} ` +
                `(Expected at: ${path.dirname(localItemTentativeLocation)}, ` +
                `GDrive: ${gDriveSize} bytes, not match with sizes: ${localItem.rawSize})`
            );
            failedFiles.push(normalizedFileName);
            sizeMisMatchGdriveItems.push(gDriveItem.googleDriveLink);
            gDriveItem.success = false;
        } 
    });

    // will fail for non unique file names
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
