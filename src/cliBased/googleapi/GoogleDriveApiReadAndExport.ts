import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
  return res;
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName);
  return res;
}

export const generateGoogleDriveListingExcel = async (driveLinkOrFolderID: string, folderName: string) => {
  const _result = await procOrigGoogleDrive(driveLinkOrFolderID, folderName);
  console.log(`generateGoogleDriveListingExcel ${JSON.stringify(_result)}`)
  return {
    ..._result,
    msg2: `Excel file created in folder ${EXPORT_ROOT_FOLDER}`
  };
}

// (() => {
//   const driveLink = "https://drive.google.com/drive/u/0/folders/1yFQaR1FeKN3WEkEGCVhF5PsalQ6-EL2C";
//   procOrigGoogleDrive(driveLink, "Treasures 66");
// })();
//yarn run catalog
