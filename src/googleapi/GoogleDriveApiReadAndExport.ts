import { google } from 'googleapis';
import { _credentials } from './_utils/credentials_gitignore';
import * as fs from 'fs';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';

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
  await procOrigGoogleDrive("1tD49TdNG_m_2R74AS_VpBkoAcWGw4-LT", 'Treasures 40');
  await procOrigGoogleDrive("1n3A4Edtqz6lWoyZNKUBINfUcfzpQ0UW6", 'Treasures 41');
  await procOrigGoogleDrive("1303P0EJY6ooJVb06Fo7XQGoL-HjvG4q7", 'Treasures 42');
  await procOrigGoogleDrive("1NppbAHIi1auKMgDsKmsZbkUfJTkdjdg0", 'Treasures 43');
  await procOrigGoogleDrive("1GvLF-GV_7U7BqPxyoIjSjxurIhcfvf3m", 'Treasures 44');
  await procOrigGoogleDrive("1WiIzzj0CKBEOSUg0dbW8NIYmRcpOGqDP", 'Treasures 45');
})();

  //yarn run catalog