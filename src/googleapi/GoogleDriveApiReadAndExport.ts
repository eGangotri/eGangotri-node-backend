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
  await procOrigGoogleDrive("1G6A8zbbiLHFlqgNnPosq1q6JbOoI2dI-", 'Treasures');
  await procOrigGoogleDrive("1CuXlQEPC06pYPo9QxcgtblJWUETfE1T7", 'Treasures 2');
  await procOrigGoogleDrive("1kSd34UyuhMwKjXAbLbkbHFDtGOGkxJXR", 'Treasures 3');
  await procOrigGoogleDrive("1OtZJAHryspt3hUvnr9q76wYVHLPVYH86", 'Treasures 4');
  await procOrigGoogleDrive("1mmYsZulrzhJHqz_h967jEcvqu5sKfwso", 'Treasures 5');
  await procOrigGoogleDrive("1wGVqEBDHwlygu3aONf4aMMjWpXsFNI59", 'Treasures 6');
  await procOrigGoogleDrive("1p65_gIL0l4CgJFZlqLlmkNo6bXOwVhE5", 'Treasures 7');
  await procOrigGoogleDrive("1kQo5u6h7GnrGWyhUuQ9aYkA_HZEIv59E", 'Treasures 8');
  await procOrigGoogleDrive("1v8BiXws4uSfYKteXWxpJLhK44Ugct8FJ", 'Treasures 9');
  await procOrigGoogleDrive("15TIpx8gHsMP7ARkUt6KkErRmUBZn0w1Y", 'Treasures 10');
})();

  //yarn run catalog