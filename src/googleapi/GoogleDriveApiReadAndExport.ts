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

 //procOrigGoogleDrive("https://drive.google.com/drive/folders/1gPM3J5fMahkBSuOJXqH730K82ddY_8kA?usp=drive_link", 'Treasures 23');
  // procOrigGoogleDrive("1JKy71EWtREKtLb60Bg6X3uBb6Zf2_JhK", 'Treasures 24');
   //procOrigGoogleDrive("https://drive.google.com/drive/folders/15LrBVDpXteKpvD8Q8-cT0GuR-U91z6yd?usp=drive_link", 'Treasures 25');
  //procOrigGoogleDrive("1PT3m9-8Obj6AiBfrWYeXazfKDrjeMRJI", 'Treasures 26');
   //procOrigGoogleDrive("1JTE35Py5f263RGjvjAbqbJMCu5dvoRe0", 'Treasures 27');
//   procOrigGoogleDrive("1Heb53B7ymtdcW4cSgLG5Y12xDPALX3sI", 'Treasures 29');
  // procOrigGoogleDrive("15vNpsd_W4GWBCqOnKbe5ad9ddFX9Ep3W", 'Treasures 30');
  //procReducedPdfGoogleDrive("https://drive.google.com/drive/folders/1Nox5h2CYgIrGcd73JswHk0_q05y0W-b7?usp=drive_link", 'Treasures 60')
  //yarn run catalog