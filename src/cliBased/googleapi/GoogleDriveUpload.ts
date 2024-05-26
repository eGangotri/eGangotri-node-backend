import { google } from 'googleapis';
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

uploadFileToGDrive("D:\\NMM-1\\July-2019\\19-07-2019\\M-1981-Vinayak Mahatmya From Ganesh Puran - Kavikulguru Kalidas Sanskrit University Ramtek Collection\\00000196.TIF",
    "https://drive.google.com/drive/folders/1opz1x_HTJCEVH2H0WgadHyDUnEPPo5nB?usp=drive_link"
);
