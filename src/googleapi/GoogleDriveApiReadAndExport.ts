import { google } from 'googleapis';
import { _credentials } from './_utils/credentials_gitignore';
import { listFolderContentsAndGenerateCSVAndExcel } from './_utils/GoogleDriveUtil';

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
// Replace 'FOLDER_ID' with the ID of the folder you want to list
// const folderId = '1pxxhV2BkyTZgq34InhTuwDh-szU0jvY4';
// listFolderContentsAndGenerateCSV(folderId, drive, 'Treasures-59');

// const driveLink = "https://drive.google.com/drive/folders/1G6A8zbbiLHFlqgNnPosq1q6JbOoI2dI-?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures');

 export const EXPORT_DEST_FOLDER = `E:\\_catalogWork\\_collation\\_catExcels`;

// const driveLink = "https://drive.google.com/drive/folders/1CuXlQEPC06pYPo9QxcgtblJWUETfE1T7?usp=drive_link"
//listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 2');

const driveLink = "https://drive.google.com/drive/folders/1kSd34UyuhMwKjXAbLbkbHFDtGOGkxJXR?usp=drive_link"
listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 3');

// const driveLink = "https://drive.google.com/drive/folders/1OtZJAHryspt3hUvnr9q76wYVHLPVYH86?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 4');

// const driveLink = "https://drive.google.com/drive/folders/1mmYsZulrzhJHqz_h967jEcvqu5sKfwso?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 5');

// const driveLink = "https://drive.google.com/drive/folders/1wGVqEBDHwlygu3aONf4aMMjWpXsFNI59?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 6');

// const driveLink = "https://drive.google.com/drive/folders/1p65_gIL0l4CgJFZlqLlmkNo6bXOwVhE5?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 7');

// const driveLink = "https://drive.google.com/drive/folders/1kQo5u6h7GnrGWyhUuQ9aYkA_HZEIv59E?usp=drive_link" 
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 8');

// const driveLink = "https://drive.google.com/drive/folders/1v8BiXws4uSfYKteXWxpJLhK44Ugct8FJ?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 9');

// const driveLink = "https://drive.google.com/drive/folders/15TIpx8gHsMP7ARkUt6KkErRmUBZn0w1Y?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures 10');


// export const EXPORT_DEST_FOLDER = `E:\\_catalogWork\\_collation\\_catReducedPdfExcels`;
// const driveLink = "https://drive.google.com/drive/folders/1Nlcx96VxWbOeR13fkJS1KvcS0lf3bhxv?usp=drive_link"
// listFolderContentsAndGenerateCSVAndExcel(driveLink, drive, 'Treasures-2');
