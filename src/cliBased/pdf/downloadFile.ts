const { DownloaderHelper } = require('node-downloader-helper');
import fs from 'fs';
import {  DOWNLOAD_COMPLETED_COUNT2, checkFileSizeConsistency, 
     incrementDownloadCompleted2, incrementDownloadFailed2,  incrementDownloadInError2 } from "./utils";
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { getGoogleDriveInstance } from '../googleapi/service/CreateGoogleDrive';
import * as path from 'path';
import { updateEntryForGDriveUploadHistory, _updateEmbeddedFileByFileName } from '../../services/GdriveDownloadRecordService';
import { GDriveDownloadHistoryStatus } from '../../utils/constants';

const drive = getGoogleDriveInstance();

export const downloadFileFromGoogleDrive = async (driveLinkOrFolderId: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw = "0",
    gDriveDownloadTaskId: string = "",
    downloadCounterController = "") => {
    console.log(`downloadFileFromGoogleDrive ${driveLinkOrFolderId}`)
    const result = await downloadGDriveFileUsingGDriveApi(driveLinkOrFolderId, destPath,
        fileName, fileSizeRaw, gDriveDownloadTaskId, downloadCounterController);
    return result;
}

export const downloadFileFromUrl = async (
    fileDumpFolder: string,
    downloadUrl: string,
    fileName: string,
    dataLength: number,
    fileSizeRaw = "0",downloadCounterController= "") => {
    console.log(`downloadFileFromUrl ${downloadUrl} to ${fileDumpFolder}`)

    const dl = new DownloaderHelper(downloadUrl, fileDumpFolder, { fileName: fileName });//
    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {
        await new Promise((resolve, reject) => {
            dl.on('end', async () => {
                const index = `(${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController) + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                _result = await checkFileSizeConsistency(fileDumpFolder, fileName, fileSizeRaw,downloadCounterController);
                if (_result?.success) {
                    incrementDownloadCompleted2(downloadCounterController);
                    _result = {
                        "status": `Downloaded ${fileName} to ${fileDumpFolder}`,
                        success: true
                    };
                }
                resolve(_result);
            });

            dl.on('error', (err) => {
                incrementDownloadInError2(downloadCounterController);
                if (err.code === 'ECONNRESET') {
                    console.error('Connection reset by peer');
                }
                console.log(`Download Failed ${fileName}` + JSON.stringify(err.message));
                reject(_result = {
                    success: false,
                    "error": `Failed download of ${fileName} to ${fileDumpFolder} with ${err.message}`
                });
            });

            dl.start();
        });
    } catch (err) {
        console.error(`downloadFileFromUrl err  ${JSON.stringify(err)}`);
        incrementDownloadInError2(downloadCounterController);
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${fileDumpFolder} with ${JSON.stringify(_result)}`
        };
        console.error(`downloadFileFromUrl result set to ${JSON.stringify(_result)}`);

    }
    console.log(`downloadFileFromUrl _result ${JSON.stringify(_result)}`);
    return _result;
}

export const downloadGDriveFileUsingGDriveApiOld = (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw = "0",
    gDriveDownloadTaskId: string = "",
    downloadCounterController = "") => {
    return new Promise(async (resolve, reject) => {
        const fileId = extractGoogleDriveId(driveLinkOrFileID);
        console.log(`downloadGDriveFileUsingGDriveApi ${driveLinkOrFileID} ${fileId} to ${destPath}`);

        if (!fileId) {
            console.error(`Invalid Google Drive link(${driveLinkOrFileID}) or File ID(${fileId})`);
            reject({
                success: false,
                error: `Invalid Google Drive link or File ID: ${driveLinkOrFileID} }`,
            });
            return;
        }

        try {
            const fileMetadata = await drive.files.get({ fileId, fields: 'name,mimeType' });
            const mimeType = fileMetadata.data.mimeType;
            fileName = fileName || fileMetadata.data.name;
            const filePath = path.join(destPath, fileName);

            updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, `started d/l of ${fileName}`, GDriveDownloadHistoryStatus.Queued);

            const dest = fs.createWriteStream(filePath);

            const exportMimeMap = {
                'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

            };

            let response;
            const exportMimeType = exportMimeMap[mimeType];
            if (exportMimeType) {
                response = await drive.files.export({ fileId, mimeType: exportMimeType }, { responseType: 'stream' });
            } else if (!mimeType.startsWith('application/vnd.google-apps.')) {
                response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
            } else {
                reject({
                    success: false,
                    error: `Unsupported Google-native MIME type: ${mimeType}`,
                });
                return;
            }

            response.data.pipe(dest);

            dest.on('finish', async () => {
                console.log(`Download complete for "${fileName}"`);
                const _fileConsistency = await checkFileSizeConsistency(destPath, fileName, fileSizeRaw, downloadCounterController);
                const _result = fileSizeRaw
                    ? _fileConsistency
                    : { success: true };

                if (_result?.success) {
                    incrementDownloadCompleted2(downloadCounterController);
                    _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Completed, `completed d/l of ${fileName}`, destPath);
                    resolve({
                        status: `Downloaded ${fileName} to ${destPath}`,
                        success: true,
                        destPath,
                    });
                } else {
                    reject(_result);
                    incrementDownloadFailed2(downloadCounterController);
                    _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `failed d/l of ${fileName}`, destPath);
                }
            });

            dest.on('error', (err) => {
                console.error('Error writing file:', err);
                incrementDownloadInError2(downloadCounterController);
                _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `error d/l of ${fileName}`, destPath);
                reject({
                    success: false,
                    error: `Error writing file for ${fileName}: ${err.message}`,
                });
            });
        } catch (error) {
            const errorContext = `Error during ${error.response?.config?.url ? 'download' : 'metadata fetch'}`;
            console.error(`${errorContext}:`, error.message);
            incrementDownloadInError2(downloadCounterController);
            _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `${errorContext}: ${error.message}`, destPath);
            reject({
                success: false,
                error: `${errorContext}: ${error.message}`,
            });
        }
    });
};

export const downloadGDriveFileUsingGDriveApi = async (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw: string = "0",
    gDriveDownloadTaskId: string = "",
    downloadCounterController: string = ""
): Promise<{ status: string; success: boolean; destPath: string }> => {
    const fileId = extractGoogleDriveId(driveLinkOrFileID);
    console.log(`downloadGDriveFileUsingGDriveApi ${driveLinkOrFileID} ${fileId} to ${destPath}`);

    if (!fileId) {
        const errorMessage = `Invalid Google Drive link(${driveLinkOrFileID}) or File ID(${fileId})`;
        console.error(errorMessage);
        throw { success: false, error: errorMessage };
    }

    try {
        const fileMetadata = await drive.files.get({ fileId, fields: 'name,mimeType' });
        const mimeType = fileMetadata.data.mimeType;
        fileName = fileName || fileMetadata.data.name;
        const filePath = path.join(destPath, fileName);

        await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, `started d/l of ${fileName}`, GDriveDownloadHistoryStatus.Queued);

        const dest = fs.createWriteStream(filePath);

        const exportMimeMap = {
            'application/vnd.google-apps.document': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };

        const exportMimeType = exportMimeMap[mimeType];
        let response;

        if (exportMimeType) {
            response = await drive.files.export({ fileId, mimeType: exportMimeType }, { responseType: 'stream' });
        } else if (!mimeType.startsWith('application/vnd.google-apps.')) {
            response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
        } else {
            throw { success: false, error: `Unsupported Google-native MIME type: ${mimeType}` };
        }

        response.data.pipe(dest);

        await new Promise((resolve, reject) => {
            dest.on('finish', resolve);
            dest.on('error', reject);
        });

        console.log(`Download complete for "${fileName}"`);
        const fileConsistency = await checkFileSizeConsistency(destPath, fileName, fileSizeRaw, downloadCounterController);
        const result = fileSizeRaw ? fileConsistency : { success: true };

        if (result?.success) {
            incrementDownloadCompleted2(downloadCounterController);
            _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Completed, `completed d/l of ${fileName}`, destPath);
            return { status: `Downloaded ${fileName} to ${destPath}`, success: true, destPath };
        } else {
            incrementDownloadFailed2(downloadCounterController);
            _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `failed d/l of ${fileName}`, destPath);
            throw result;
        }
    } catch (error) {
        const errorContext = `Error during ${error.response?.config?.url ? 'download' : 'metadata fetch'}`;
        console.error(`${errorContext}:`, error.message);
         incrementDownloadInError2(downloadCounterController);
         _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `${errorContext}: ${error.message}`, destPath);
        throw { success: false, error: `${errorContext}: ${error.message}` };
    }
};

//pnpm run downloadPdf