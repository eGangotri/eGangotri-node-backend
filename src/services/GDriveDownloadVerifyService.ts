import * as path from 'path';
import mongoose from 'mongoose';

import { downloadFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { genLinksAndFolders } from './yarnListMakerService';
import { getFolderNameFromGDrive } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { GDRIVE_DEFAULT_IGNORE_FOLDER, verifyGDriveLocalIntegirtyPerLink, verifyGDriveLocalIntegrity, ComparisonResult } from './GDriveService';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { createFolderIfNotExistsAsync } from '../utils/FileUtils';
import GDriveDownload, { IGDriveDownload } from '../models/GDriveDownloadHistory';
import { GoogleApiDataWithLocalData } from '../cliBased/googleapi/types';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';
import { verifyUnzipSuccessInDirectory } from './zipService';
import { markVerifiedForGDriveDownload } from './gDriveDownloadService';

export class RedownloadHttpError extends Error {
    statusCode: number;
    body: any;

    constructor(statusCode: number, body: any) {
        super(typeof body === 'string' ? body : body?.response?.message || 'RedownloadHttpError');
        this.statusCode = statusCode;
        this.body = body;
    }
}

export async function redownloadFromGDriveService(params: {
    id: string;
}): Promise<{ statusCode: number; body: any }> {
    const { id } = params;
    const startTime = Date.now();

    const _gDriveDownload = await GDriveDownload.findById(id);
    const googleDriveLink = _gDriveDownload?.googleDriveLink;
    const folderOrProfile = _gDriveDownload?.fileDumpFolder;
    const fileType = _gDriveDownload?.downloadType;
    const ignoreFolder = _gDriveDownload?.ignoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;

    if (!_gDriveDownload) {
        throw new RedownloadHttpError(404, {
            response: {
                status: 'failed',
                success: false,
                msg: `GDrive download record not found for id: ${id}`,
            },
        });
    }

    const _linksGen = genLinksAndFolders(googleDriveLink, folderOrProfile);
    if (_linksGen.error) {
        throw new RedownloadHttpError(400, {
            response: {
                status: 'failed',
                success: false,
                message: _linksGen.message,
            },
        });
    }

    const _rootFolders = await Promise.all(
        _linksGen._links.map(async (link) => (await getFolderNameFromGDrive(link)) || ''),
    );
    const foldersWithRoot2 = _linksGen._folders.map((folder, index) => {
        const fileDumpFolder = getPathOrSrcRootForProfile(folder);
        return path.join(fileDumpFolder, _rootFolders[index]);
    });

    const _results = await verifyGDriveLocalIntegrity(
        _linksGen._links,
        foldersWithRoot2,
        ignoreFolder,
        fileType,
    );
    const resultResponse = _results.response;
    const comparisonResult: ComparisonResult[] = resultResponse.comparisonResult;
    const success = comparisonResult.every((r) => r.success);

    if (!success) {
        const failedGDriveData: GoogleApiDataWithLocalData[] =
            resultResponse.googleDriveFileStats.flatMap(
                (gDriveData: GoogleApiDataWithLocalData[]) => {
                    return [...gDriveData.filter((file) => !file.success)];
                },
            );

        const gDriveDownloadId = _gDriveDownload._id.toString();
        resetDownloadCounters(_gDriveDownload.runId || '');
        const downloadPromises = failedGDriveData.map(
            async (gDriveData: GoogleApiDataWithLocalData) => {
                const _folder = path.dirname(gDriveData.localAbsPath);
                await createFolderIfNotExistsAsync(_folder);
                return downloadFromGoogleDriveToProfile(
                    gDriveData.googleDriveLink,
                    _folder,
                    ignoreFolder,
                    fileType,
                    _gDriveDownload.runId || '',
                    _gDriveDownload.commonRunId || '',
                    gDriveDownloadId,
                );
            },
        );

        const results = await Promise.all(downloadPromises);
        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        return {
            statusCode: 200,
            body: {
                msg: `${failedGDriveData.length} links attempted-download to ${foldersWithRoot2.length} profiles`,
                timeTaken: timeInfo(timeTaken),
                response: results,
                failedItems: failedGDriveData,
            },
        };
    }

    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    return {
        statusCode: 200,
        body: {
            msg: 'No failed items to download',
            failedItems: [],
            timeTaken: timeInfo(timeTaken),
            response: [],
        },
    };
}

export async function verifyLocalDownloadSameAsGDriveService(params: {
    id?: string;
    googleDriveLink?: string;
    profile?: string;
    downloadType?: string;
    ignoreFolder?: string;
    verifyBySizeOnly?: boolean;
}): Promise<{ statusCode: number; body: any }> {
    const {
        id,
        googleDriveLink: inputGoogleDriveLink,
        profile,
        downloadType,
        ignoreFolder: inputIgnoreFolder,
        verifyBySizeOnly = false,
    } = params;

    const { googleDriveLink, folderOrProfile, fileType, ignoreFolder } = await resolveDownloadParams(
        id,
        inputGoogleDriveLink,
        profile,
        downloadType,
        inputIgnoreFolder
    );

    if (!googleDriveLink || !folderOrProfile) {
        throw new RedownloadHttpError(400, {
            response: {
                status: 'failed',
                success: false,
                msg: `Invalid Google Drive Link (${googleDriveLink}) or Folder/Profile (${folderOrProfile}). Pls. provide valid values`,
            },
        });
    }

    const startTime = Date.now();

    if (id && id !== '') {
        const linksGen = genLinksAndFolders(googleDriveLink, folderOrProfile);
        if (linksGen.error) {
            throw new RedownloadHttpError(400, {
                response: {
                    status: 'failed',
                    success: false,
                    message: linksGen.message,
                },
            });
        }

        const rootFolders = await Promise.all(
            linksGen._links.map(async (link) => (await getFolderNameFromGDrive(link)) || ''),
        );
        const foldersWithRoot = linksGen._folders.map((folder, index) => {
            const fileDumpFolder = getPathOrSrcRootForProfile(folder);
            return path.join(fileDumpFolder, rootFolders[index]);
        });

        const results = await verifyGDriveLocalIntegrity(
            linksGen._links,
            foldersWithRoot,
            ignoreFolder,
            fileType,
            verifyBySizeOnly,
        );
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        const success = results.response.comparisonResult.every((r: ComparisonResult) => r.success);
        await markVerifiedForGDriveDownload(id, success);

        if (fileType === ZIP_TYPE) {
            const unzipResults = await Promise.all(
                foldersWithRoot.map(async (folder) => {
                    const result = await verifyUnzipSuccessInDirectory(
                        folder,
                        '',
                        ignoreFolder,
                    );
                    return {
                        folder,
                        ...result,
                    };
                }),
            );

            const response = {
                success,
                ...results,
                timeTaken: timeInfo(timeTaken),
                unzipVerification: {
                    totalSuccessCount: unzipResults.reduce(
                        (sum, r) => sum + r.success_count,
                        0,
                    ),
                    totalErrorCount: unzipResults.reduce(
                        (sum, r) => sum + r.error_count,
                        0,
                    ),
                    resultsByFolder: unzipResults.map((result) => ({
                        folder: result.folder,
                        successCount: result.success_count,
                        errorCount: result.error_count,
                        unzipFolder: result.unzipFolder,
                        zipFilesFailed: result.zipFilesFailed,
                    })),
                },
            };

            return {
                statusCode: 200,
                body: response,
            };
        }

        return {
            statusCode: 200,
            body: {
                ...results,
                timeTaken: timeInfo(timeTaken),
            },
        };
    }

    const results = await verifyGDriveLocalIntegirtyPerLink(
        googleDriveLink,
        folderOrProfile,
        ignoreFolder,
        fileType,
        verifyBySizeOnly,
    );
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    return {
        statusCode: 200,
        body: {
            ...results,
            timeTaken: timeInfo(timeTaken),
        },
    };
}

/**
 * 
 * @param results [
  {
    "msg": "2 links attempted-download to 1 profiles",
    "timeTaken": "12.5s",
    "response": [
      {
        "success_count": 1,
        "error_count": 0,
        "dl_wrong_size_count": 0,
        "gDriveDownloadTaskId": "task-uuid-1"
      },
      {
        "success_count": 0,
        "error_count": 1,
        "dl_wrong_size_count": 0,
        "gDriveDownloadTaskId": "task-uuid-2"
      }
    ],
    "failedItems": [
      {
        "id": "file-id-1",
        "name": "document1.pdf",
        "mimeType": "application/pdf",
        "googleDriveLink": "https://drive.google.com/...",
        "localAbsPath": "/path/to/document1.pdf",
        "success": false
      },
      {
        "id": "file-id-2",
        "name": "document2.pdf",
        "mimeType": "application/pdf",
        "googleDriveLink": "https://drive.google.com/...",
        "localAbsPath": "/path/to/document2.pdf",
        "success": false
      }
    ]
  },
  {
    "msg": "No failed items to download",
    "failedItems": [],
    "timeTaken": "0.5s",
    "resultsSummary": [],
    "response": []
  }
]
 * @returns 
 */
export function aggregateRedwnldResults(results: any[]) {
    const successCountPerResponse = results.map(result => {
        if (Array.isArray(result.response)) {
            return result.response.reduce((acc: number, item: any) => acc + (item.success_count || 0), 0);
        }
        return 0;
    });

    const totalSuccessCount = successCountPerResponse.reduce((acc: number, item: number) => acc + item, 0);
    const errorCountPerResponse = results.map(result => {
        if (Array.isArray(result.response)) {
            return result.response.reduce((acc: number, item: any) => acc + (item.error_count || 0), 0);
        }
        return 0;
    });

    const totalErrorCount = errorCountPerResponse.reduce((acc: number, item: number) => acc + item, 0);

    return {
        successCountPerResponse: successCountPerResponse.join('+ '),
        errorCountPerResponse: errorCountPerResponse.join('+ '),
        totalSuccessCount,
        totalErrorCount,
    };
}
export function aggregateVerificationResults(results: any[]) {


    // Calculate aggregate statistics
    const totalVerifications = results.reduce((sum, result) => {
        return sum + (result.response.comparisonResult?.length || 0);
    }, 0);

    const totalSuccessAsString = []
    const totalSuccessCounts = results.reduce((sum, result) => {
        const compRes = result.response.comparisonResult;
        let val = 0;
        if (Array.isArray(compRes)) {
            val = compRes.reduce((acc: number, item: any) => acc + (item.successMsgsCount || 0), 0);
        } else {
            val = (compRes?.successMsgsCount || 0);
        }
        totalSuccessAsString.push(`${val}`)
        return sum + val;
    }, 0);

    const totalErrorAsStringCounts = []
    const totalErrorCounts = results.reduce((sum, result) => {
        const compRes = result.response.comparisonResult;
        let val = 0;
        if (Array.isArray(compRes)) {
            val = compRes.reduce((acc: number, item: any) => acc + (item.failedCount || 0), 0);
        } else {
            val = (compRes?.failedCount || 0);
        }
        totalErrorAsStringCounts.push(`${val}`)
        return sum + val;
    }, 0);


    const failedVerifications = results.reduce((sum, result) => {
        if (!result.response.comparisonResult) return sum;
        return sum + result.response.comparisonResult.filter((cr: any) => !cr.success).length;
    }, 0);

    // Create summary array
    const resultsSummary = [];

    // Add aggregate summary as first item
    resultsSummary.push(
        `${failedVerifications} out of ${totalVerifications} Verification(s) failed`
    );

    // Add individual verification results
    results.forEach((result, resultIndex) => {
        const compRes = result.response.comparisonResult
        if (compRes?.length) {
            compRes.forEach((comparisonResult: any, compIndex: number) => {
                const verificationStatus = comparisonResult.success ? 'Passed' : 'Failed';
                const successCount = comparisonResult.successMsgsCount || 0;
                const errorCount = comparisonResult.failedCount || 0;

                resultsSummary.push(
                    `Verification: ${verificationStatus}, Succ: ${successCount} Error: ${errorCount}`
                );
            });
        }
    });

    return {
        quickSummary: {
            "Total Verifications": totalVerifications,
            "Failed Verifications": failedVerifications,
            "Successful Verifications": totalVerifications - failedVerifications,
            "Successes/Row": totalSuccessAsString.join('+ '),
            "All Row Successes Count": totalSuccessCounts,
            "Failures/Row": totalErrorAsStringCounts.join('+ '),
            "All Row Failures Count": totalErrorCounts,
            "Results Summary": resultsSummary,
        }
    };
}

async function resolveDownloadParams(
    id: string | undefined,
    inputGoogleDriveLink: string | undefined,
    profile: string | undefined,
    downloadType: string | undefined,
    inputIgnoreFolder: string | undefined
) {
    let googleDriveLink: string | undefined;
    let folderOrProfile: string | undefined;
    let fileType: string = downloadType || PDF_TYPE;
    let ignoreFolder = inputIgnoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;

    if (id && id !== '') {
        console.log(`verifyLocalDownloadSameAsGDrive:id ${id}`);
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            throw new RedownloadHttpError(404, {
                response: {
                    status: 'failed',
                    success: false,
                    msg: `GDrive download record not found for id: ${id}`,
                },
            });
        }
        googleDriveLink = gDriveDownload.googleDriveLink;
        folderOrProfile = gDriveDownload.fileDumpFolder;
        fileType = gDriveDownload.downloadType || fileType;
        ignoreFolder = gDriveDownload.ignoreFolder || ignoreFolder;
    } else {
        googleDriveLink = inputGoogleDriveLink;
        const _profile = profile || '';
        fileType = downloadType || PDF_TYPE;
        ignoreFolder = inputIgnoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;
        folderOrProfile = getPathOrSrcRootForProfile(_profile);
    }

    return { googleDriveLink, folderOrProfile, fileType, ignoreFolder };
}
