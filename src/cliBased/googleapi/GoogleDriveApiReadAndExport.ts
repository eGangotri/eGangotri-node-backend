import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName);
}

procOrigGoogleDrive("https://drive.google.com/drive/folders/1QAX6-KZx6MNcQxi5CPFcd44LKOiZ0ZDh?usp=drive_link", "Treasures 62" )

//yarn run catalog
