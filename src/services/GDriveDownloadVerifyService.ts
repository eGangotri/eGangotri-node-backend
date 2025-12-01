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
        const resultsSummary = results.map((res: any, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count
                } Wrong Size: ${res.dl_wrong_size_count}`;
        });

        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        return {
            statusCode: 200,
            body: {
                msg: `${failedGDriveData.length} links attempted-download to ${foldersWithRoot2.length} profiles`,
                timeTaken: timeInfo(timeTaken),
                resultsSummary,
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
            resultsSummary: [],
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

    let googleDriveLink: string | undefined;
    let folderOrProfile: string | undefined;
    let fileType: string = downloadType || PDF_TYPE;
    let ignoreFolder = inputIgnoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;
    
    console.log(`verifyLocalDownloadSameAsGDrive {"id":"${id}"}`);
    
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
