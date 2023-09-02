import { _credentials } from './_utils/credentials_gitignore';
import { listFolderContentsAndGenerateCSVAndExcel, listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName);
}

procOrigGoogleDrive("https://drive.google.com/drive/folders/1VB3IrgcM79kDI3FE99cw5oLBwNGyDqFY?usp=drive_link", "Treasures 61" )

//yarn run catalog
