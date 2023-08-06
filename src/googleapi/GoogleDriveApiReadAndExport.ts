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

(async () =>{
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/1RNqkZAsxUshRoNIBwHet314ISQtqY5Fc?usp=drive_link", 'Treasures 33');
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/1xdXI2_sUpnHf2lU6UhDLwzDtf7WTyF8k?usp=drive_link", 'Treasures 34');
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/1A3EhS2C2GmvbNLkM4SyEL4H8Y5703-cO?usp=drive_link", 'Treasures 35');
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/13yG1LqFHZyzFx8sgSMENNOEVtrz8JoQs?usp=drive_link", 'Treasures 36');
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/1lrrTCTLNROEw8pvj4f84XKjN6Ar1S0Ag?usp=drive_link", 'Treasures 37');

})();

   ///procReducedPdfGoogleDrive("https://drive.google.com/drive/folders/1Nox5h2CYgIrGcd73JswHk0_q05y0W-b7?usp=drive_link", 'Treasures 60')
  //yarn run catalog