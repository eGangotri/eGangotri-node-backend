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

const driveLink = "https://drive.google.com/drive/u/0/folders/1yFQaR1FeKN3WEkEGCVhF5PsalQ6-EL2C";
procOrigGoogleDrive(driveLink, "Treasures 66" )

//yarn run catalog
