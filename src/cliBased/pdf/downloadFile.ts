const { DownloaderHelper } = require('node-downloader-helper');
import fs from 'fs';
import { DOWNLOAD_COMPLETED_COUNT, checkFileSizeConsistency, incrementDownloadComplete, incrementDownloadInError } from "./utils";
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { getGoogleDriveInstance } from '../googleapi/service/CreateGoogleDrive';
import * as path from 'path';
import { updateEntryForGDriveUploadHistory, updateEmbeddedFileByFileName } from '../../services/GdriveDownloadRecordService';
import { GDriveDownloadHistoryStatus } from '../../utils/constants';

const drive = getGoogleDriveInstance();

export const downloadFileFromGoogleDrive = async (driveLinkOrFolderId: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw = "0", gDriveDownloadTaskId: string = "") => {
    console.log(`downloadFileFromGoogleDrive ${driveLinkOrFolderId}`)
    const result = await downloadGDriveFileUsingGDriveApi(driveLinkOrFolderId, destPath,
        fileName, fileSizeRaw, gDriveDownloadTaskId);
    return result;
}

export const downloadFileFromUrl = async (
    fileDumpFolder: string,
    downloadUrl: string,
    fileName: string,
    dataLength: number,
    fileSizeRaw = "0") => {
    console.log(`downloadFileFromUrl ${downloadUrl} to ${fileDumpFolder}`)

    const dl = new DownloaderHelper(downloadUrl, fileDumpFolder, { fileName: fileName });//
    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {
        await new Promise((resolve, reject) => {
            dl.on('end', () => {
                const index = `(${DOWNLOAD_COMPLETED_COUNT + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                _result = checkFileSizeConsistency(fileDumpFolder, fileName, fileSizeRaw);
                if (_result?.success) {
                    incrementDownloadComplete();
                    _result = {
                        "status": `Downloaded ${fileName} to ${fileDumpFolder}`,
                        success: true
                    };
                }
                resolve(_result);
            });

            dl.on('error', (err) => {
                incrementDownloadInError();
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
        incrementDownloadInError();
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${fileDumpFolder} with ${JSON.stringify(_result)}`
        };
        console.error(`downloadFileFromUrl result set to ${JSON.stringify(_result)}`);

    }
    console.log(`downloadFileFromUrl _result ${JSON.stringify(_result)}`);
    return _result;
}

export const downloadGDriveFileUsingGDriveApi = (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw = "0", gDriveDownloadTaskId: string = "") => {
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

            dest.on('finish', () => {
                console.log(`Download complete for "${fileName}"`);
                const _result = fileSizeRaw
                    ? checkFileSizeConsistency(destPath, fileName, fileSizeRaw)
                    : { success: true };

                if (_result?.success) {
                    incrementDownloadComplete();
                    updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Completed, `completed d/l of ${fileName}`, destPath);
                    resolve({
                        status: `Downloaded ${fileName} to ${destPath}`,
                        success: true,
                        destPath,
                    });
                } else {
                    reject(_result);
                    updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `failed d/l of ${fileName}`, destPath);
                }
            });

            dest.on('error', (err) => {
                console.error('Error writing file:', err);
                incrementDownloadInError();
                updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `failed d/l of ${fileName}`, destPath);
                reject({
                    success: false,
                    error: `Error writing file for ${fileName}: ${err.message}`,
                });
            });
        } catch (error) {
            const errorContext = `Error during ${error.response?.config?.url ? 'download' : 'metadata fetch'}`;
            console.error(`${errorContext}:`, error.message);
            incrementDownloadInError();
            updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, GDriveDownloadHistoryStatus.Failed, `${errorContext}: ${error.message}`, destPath);
            reject({
                success: false,
                error: `${errorContext}: ${error.message}`,
            });
        }
    });
};


//pnpm run downloadPdf