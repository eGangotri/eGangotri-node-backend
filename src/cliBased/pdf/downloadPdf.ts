import fs from 'fs';
import axios from 'axios';
import { DOWNLOAD_COMPLETED_COUNT, checkFileSizeConsistency, incrementDownloadComplete, incrementDownloadInError } from "./utils";
import { extractGoogleDriveId, getGDrivePdfDownloadLink } from '../../mirror/GoogleDriveUtilsCommonCode';
import { drive_v3 } from 'googleapis';
import { getGoogleDriveInstance } from '../../cliBased/googleapi/service/CreateGoogleDrive';
import * as path from 'path';

const { DownloaderHelper } = require('node-downloader-helper');

const DEFAULT_DUMP_FOLDER = "D:\\_playground\\_dwnldPlayground";
const drive = getGoogleDriveInstance();

export const downloadFileFromGoogleDrive = async (driveLinkOrFolderId: string,
    destPath: string,
    fileName: string = "",
    dataLength: number = 0,
    fileSizeRaw = "0") => {
    console.log(`downloadFileFromGoogleDrive ${driveLinkOrFolderId}`)
    const driveId = extractGoogleDriveId(driveLinkOrFolderId)
    // const result = await downloadFileFromUrl(pdfDumpFolder, getGDrivePdfDownloadLink(driveId), fileName, dataLength, fileSizeRaw);
    const result = await downloadGDriveFileUsingGDriveApi( driveId, destPath, fileName, dataLength, fileSizeRaw);
    return result;
}

export const downloadFileFromUrl = async (
    pdfDumpFolder: string,
    downloadUrl: string,
    fileName: string,
    dataLength: number,
    fileSizeRaw = "0") => {
    console.log(`downloadFileFromUrl ${downloadUrl} to ${pdfDumpFolder}`)

    const dl = new DownloaderHelper(downloadUrl, pdfDumpFolder, { fileName: fileName });//
    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {
        await new Promise((resolve, reject) => {
            dl.on('end', () => {
                const index = `(${DOWNLOAD_COMPLETED_COUNT + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                _result = checkFileSizeConsistency(pdfDumpFolder, fileName, fileSizeRaw);
                if (_result?.success) {
                    incrementDownloadComplete();
                    _result = {
                        "status": `Downloaded ${fileName} to ${pdfDumpFolder}`,
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
                    "error": `Failed download of ${fileName} to ${pdfDumpFolder} with ${err.message}`
                });
            });

            dl.start();
        });
    } catch (err) {
        console.error(err);
        incrementDownloadInError();
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${pdfDumpFolder} with ${err.message}`
        };
    }

    return _result;
}

export const downloadGDriveFileUsingGDriveApiWithRaceCon = async (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    dataLength: number,
    fileSizeRaw = "0") => {
    const fileId = extractGoogleDriveId(driveLinkOrFileID)
    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {
        // Step 1: Get the file metadata to retrieve the original file name
        if (!fileName) {
            const fileMetadata = await drive.files.get({ fileId, fields: 'name' });
            fileName = fileMetadata.data.name;
        }

        const filePath = path.join(destPath, fileName);
        const dest = fs.createWriteStream(filePath);

        // Step 2: Download the file using the original file name
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

        res.data
            .on('end', () => {
                console.log('Download complete.');
                const index = `(${DOWNLOAD_COMPLETED_COUNT + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                _result = checkFileSizeConsistency(destPath, fileName, fileSizeRaw);
                if (_result?.success) {
                    incrementDownloadComplete();
                    _result = {
                        "status": `Downloaded ${fileName} to ${destPath}`,
                        success: true
                    };
                }
            })
            .on('error', (err: any) => {
                console.error('Error during download:', err);
                incrementDownloadInError();
                if (err.code === 'ECONNRESET') {
                    console.error('Connection reset by peer');
                }
                console.log(`Download Failed ${fileName}` + JSON.stringify(err.message));
                _result = {
                    success: false,
                    "error": `Failed download of ${fileName} to ${destPath} with ${err.message}`
                }
            })
            .pipe(dest);
    } catch (error) {
        console.error('Error:', error.message);
        incrementDownloadInError();
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${destPath} with ${error.message}`
        };
    };
    return _result;
}

export const downloadGDriveFileUsingGDriveApi = (
    driveLinkOrFileID: string,
    destPath: string,
    fileName: string = "",
    dataLength: number,
    fileSizeRaw = "0") => {
    return new Promise(async (resolve, reject) => {
        const fileId = extractGoogleDriveId(driveLinkOrFileID)
        try {
            // Step 1: Get the file metadata to retrieve the original file name
            if (!fileName) {
                const fileMetadata = await drive.files.get({ fileId, fields: 'name' });
                fileName = fileMetadata.data.name;
            }

            const filePath = path.join(destPath, fileName);
            const dest = fs.createWriteStream(filePath);

            // Step 2: Download the file using the original file name
            const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

            res.data
                .on('end', () => {
                    console.log('Download complete.');
                    const index = `(${DOWNLOAD_COMPLETED_COUNT + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                    console.log(`${index}. Downloaded ${fileName}`);
                    const _result = checkFileSizeConsistency(destPath, fileName, fileSizeRaw);
                    if (_result?.success) {
                        incrementDownloadComplete();
                        resolve({
                            "status": `Downloaded ${fileName} to ${destPath}`,
                            success: true
                        });
                    } else {
                        reject(_result);
                    }
                })
                .on('error', (err: any) => {
                    console.error('Error during download:', err);
                    incrementDownloadInError();
                    if (err.code === 'ECONNRESET') {
                        console.error('Connection reset by peer');
                    }
                    console.log(`Download Failed ${fileName}` + JSON.stringify(err.message));
                    reject({
                        success: false,
                        "error": `Failed download of ${fileName} to ${destPath} with ${err.message}`
                    });
                })
                .pipe(dest);
        } catch (error) {
            console.error('Error:', error.message);
            incrementDownloadInError();
            reject({
                success: false,
                "error": `Failed download try/catch for ${fileName} to ${destPath} with ${error.message}`
            });
        };
    });
}
//yarn run downloadPdf