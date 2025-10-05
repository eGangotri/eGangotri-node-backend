const { DownloaderHelper } = require('node-downloader-helper');
import fs from 'fs';
import {
    DOWNLOAD_COMPLETED_COUNT, checkFileSizeConsistency,
    incrementDownloadCompleted, incrementDownloadFailed, incrementDownloadInError
} from "./utils";
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { getGoogleDriveInstance } from '../googleapi/service/CreateGoogleDrive';
import * as path from 'path';
import { updateEntryForGDriveUploadHistory, _updateEmbeddedFileByFileName } from '../../services/GdriveDownloadRecordService';
import { DownloadHistoryStatus } from '../../utils/constants';

const drive = getGoogleDriveInstance();

export const downloadFileFromGoogleDrive = async (driveLinkOrFolderId: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw = "0",
    gDriveDownloadTaskId: string = "",
    runIdWithIndex = "") => {
    console.log(`downloadFileFromGoogleDrive ${driveLinkOrFolderId}`)
    const result = await downloadGDriveFileUsingGDriveApi(driveLinkOrFolderId, destPath,
        fileName, fileSizeRaw, gDriveDownloadTaskId, runIdWithIndex);
    return result;
}

export const downloadFileFromUrl = async (
    fileDumpFolder: string,
    downloadUrl: string,
    fileName: string,
    dataLength: number,
    fileSizeRaw = "0", downloadCounterController = "") => {
    console.log(`downloadFileFromUrl ${downloadUrl} to ${fileDumpFolder}`)

    const dl = new DownloaderHelper(downloadUrl, fileDumpFolder, { fileName: fileName });//
    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {
        await new Promise((resolve, reject) => {
            dl.on('error', (err) => {
                dl.stop();
                reject(err);
            });
            dl.on('end', async () => {
                const index = `(${DOWNLOAD_COMPLETED_COUNT(downloadCounterController) + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                _result = await checkFileSizeConsistency(fileDumpFolder, fileName, fileSizeRaw, downloadCounterController);
                if (_result?.success) {
                    incrementDownloadCompleted(downloadCounterController);
                    _result = {
                        "status": `Downloaded ${fileName} to ${fileDumpFolder}`,
                        success: true
                    };
                }
                resolve(_result);
            });

            dl.on('error', (err) => {
                incrementDownloadInError(downloadCounterController);
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
        incrementDownloadInError(downloadCounterController);
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${fileDumpFolder} with ${JSON.stringify(_result)}`
        };
        console.error(`downloadFileFromUrl result set to ${JSON.stringify(_result)}`);

    }
    console.log(`downloadFileFromUrl _result ${JSON.stringify(_result)}`);
    return _result;
}

export const downloadGDriveFileUsingGDriveApi = async (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    fileSizeRaw: string = "0",
    gDriveDownloadTaskId: string = "",
    runIdWithIndex: string = ""
): Promise<{ status: string; success: boolean; destPath: string , error?: string}> => {
    const fileId = extractGoogleDriveId(driveLinkOrFileID);
    console.log(`downloadGDriveFileUsingGDriveApi ${driveLinkOrFileID} ${fileId} to ${destPath}`);

    if (!fileId) {
        const errorMessage = `Invalid Google Drive link(${driveLinkOrFileID}) or File ID(${fileId})`;
        console.error(errorMessage);
        return { status: errorMessage, success: false, error: errorMessage, destPath };
    }

    try {
        const fileMetadata = await drive.files.get({ fileId, fields: 'name,mimeType' });
        const mimeType = fileMetadata.data.mimeType;
        fileName = fileName || fileMetadata.data.name;
        const filePath = path.join(destPath, fileName);

        await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
             `started d/l of ${fileName}`, 
             DownloadHistoryStatus.Queued);

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
            response.data.on('error', (error) => {
                dest.destroy();
                reject(error);
            });
            dest.on('finish', () => {
                dest.close();
                resolve(null);
            });
            dest.on('error', (error) => {
                dest.destroy();
                reject(error);
            });
        });

        console.log(`Download complete for "${fileName}"`);
        const fileConsistency = await checkFileSizeConsistency(destPath, fileName, fileSizeRaw, runIdWithIndex);
        const result = fileSizeRaw ? fileConsistency : { success: true };

        if (result?.success) {
            incrementDownloadCompleted(runIdWithIndex);
            await _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, DownloadHistoryStatus.Completed, `completed d/l of ${fileName}`, destPath);
            return { status: `Downloaded ${fileName} to ${destPath}`, success: true, destPath };
        } else {
            console.log(`downloadGDriveFileUsingGDriveApi else-1`)
            incrementDownloadFailed(runIdWithIndex);
            console.log(`downloadGDriveFileUsingGDriveApi else-2`)

            await _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, DownloadHistoryStatus.Failed, `failed d/l of ${fileName}`, destPath);
            console.log(`downloadGDriveFileUsingGDriveApi else-3`);
            return {
                status: `File Consistency Check Failed for download ${fileName} to ${destPath}`,
                success: false,
                destPath
            };
        }
    } catch (error) {
        const errorContext = `Error during (${JSON.stringify(error)}) d/l for ${fileName}`;
        console.error(`${errorContext}:`, error.message);
        if (runIdWithIndex) {
            incrementDownloadInError(runIdWithIndex);
        }
        await _updateEmbeddedFileByFileName(gDriveDownloadTaskId, fileName, DownloadHistoryStatus.Failed, `${errorContext}: ${error.message}`, destPath);
        return { status: `${errorContext}: ${error.message}`,
                 success: false,
                 error: `${errorContext}: ${error.message}`,
                 destPath };
    }   
};

//pnpm run downloadPdf