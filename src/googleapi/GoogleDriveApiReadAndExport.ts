import { google } from 'googleapis';
import { _credentials } from './_utils/credentials_gitignore';
import * as fs from 'fs';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';
import * as FileUtils from "../imgToPdf/utils/FileUtils";

// Set up OAuth2 credentials
const credentials = {
  ..._credentials,
  refresh_token: '1//0gNBMXupFzUULCgYIARAAGBASNwF-L9IrnF4rkWHpvRSV1TqBV7ujMRHZP-biHpMFJQvpWW-4e5dlNGlNyGfnCW0ywWv3XLkHtmc',
};

// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

// Set the credentials for the OAuth2 client
oauth2Client.setCredentials({
  refresh_token: credentials.refresh_token,
});

// Create a new Google Drive instance
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catExcels`, folderName);
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedPdfExcels`, folderName);
}

(async () => {
  await procOrigGoogleDrive("1bIwH9eD_F5qVv5u2rbedeoSIu0dkZzxP", 'Treasures 46');
  await procOrigGoogleDrive("1Wh_pNnqZq4MprnnbjbveZEQSwN3T5_yQ", 'Treasures 47');
  await procOrigGoogleDrive("1g8Kc0M6jfEDOX_BTX-014jQwL56T-nRD", 'Treasures 48');
  await procOrigGoogleDrive("1CAU2oq40DR4A5ZNIveWqw4oOMLZgkFW4", 'Treasures 49');
  await procOrigGoogleDrive("1saOD3zWKZrDfMWT086tPqVFmjOTrtdMn", 'Treasures 50');
  await procOrigGoogleDrive("1ZVcABu3G1HQNLSvUOD9hZG8lvYMi2yp7", 'Treasures 51');
  await procOrigGoogleDrive("1jjJIkcfXzewXeftMeErWRG-Yw51wBEZa", 'Treasures 52');
  await procOrigGoogleDrive("1QZcOJ0lKUNZuN_tNk6BXfypYB4zOOh34", 'Treasures 53');
  await procOrigGoogleDrive("1nSwJ7j3w4gXvuLnhUwus3LZxDrVbrPyy", 'Treasures 54');
  await procOrigGoogleDrive("1tFOSD3avUyb0Uia1Zu1oGPyzuCLrYJ4N", 'Treasures 55');
  await procOrigGoogleDrive("1gkvQtEDXvur6fgBFajPiX6J96GHYtOyi", 'Treasures 56');
  await procOrigGoogleDrive("1FnH3_020ZIV2IQbZWr7A2o85g2svdXLR", 'Treasures 57');
  await procOrigGoogleDrive("1D5fWH7K6nA93R3O_2NngJLFL5z5zK1oN", 'Treasures 58');
  await procOrigGoogleDrive("1bxAMIEFAEO-SerkV_2ZzxiFgn3uobDII", 'Treasures 59');
})();

  //yarn run catalog