import { drive_v3, google } from 'googleapis';
import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import * as mime from 'mime-types';
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { PDF_MIME_TYPE } from './_utils/constants';

function uploadFileToGDrive(filePath: string, driveLinkOrFolderID: string) {
    const folderId = extractGoogleDriveId(driveLinkOrFolderID)

    const drive = getGoogleDriveInstance();
    const mimeType = mime.lookup(filePath) || PDF_MIME_TYPE;

    const fileMetadata = {
        'name': path.basename(filePath),
        'parents': [folderId]
    };
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
    };

    drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
    }, (err: any, file: any) => {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File Id:', file.data.id);
        }
    });
}

async function findFolderByPath(drive: drive_v3.Drive, driveLinkOrFolderID: string, gDrivePath: string) {
    const folderId = extractGoogleDriveId(driveLinkOrFolderID)

    const folderNames = gDrivePath.split(path.sep);
    let currentFolderId = folderId;

    for (const folderName of folderNames) {
        currentFolderId = await findSubFolderId(drive, currentFolderId, folderName);
        if (!currentFolderId) {
            console.log(`Folder not found: ${folderName}`);
            return;
        }
    }

    console.log(`Found folder: ${currentFolderId}`);
}

async function findSubFolderId(drive: drive_v3.Drive, folderId: string, folderName: string): Promise<string | null> {
    const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files.length === 0) {
        return null;
    }

    return files[0].id;
}

const drive = getGoogleDriveInstance();

findFolderByPath(drive, "https://drive.google.com/drive/folders/17BwW6ksj-i53XLDygWRA013q1-e2stDC?usp=drive_link", 
"01-08-2019\\M-9-Yajnavalkya Shiksha_Anuvak_Vajasaneyi Samhita - Kavikulguru Kalidas Sanskrit University Ramtek Collection")