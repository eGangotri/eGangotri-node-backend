import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { isValidDriveId } from './Utils';
<<<<<<< HEAD
=======
import { PDF_TYPE } from './_utils/constants';
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

<<<<<<< HEAD
async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", pdfOnly = true) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
    `${EXPORT_ROOT_FOLDER}_googleDriveExcels`,
    folderName, ignoreFolder, pdfOnly);
  return res;
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", pdfOnly = true) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
    `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, pdfOnly);
=======
async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", type=PDF_TYPE) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
    `${EXPORT_ROOT_FOLDER}_googleDriveExcels`,
    folderName, ignoreFolder, type);
  return res;
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", type=PDF_TYPE) {
  const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
    `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, type);
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
  return res;
}

export const generateGoogleDriveListingExcel = async (driveLinkOrFolderID: string,
  folderName: string,
  reduced = false,
  ignoreFolder = "",
<<<<<<< HEAD
 pdfOnly = true) => {
=======
  type=PDF_TYPE) => {
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
  //check if driveLinkOrFolderID is a valid google link
  if (!isValidDriveId(driveLinkOrFolderID)) {
    return {
      msg: `Invalid Google Drive Link/folderId ${driveLinkOrFolderID}`,
      success: false
    }
  }
  try {
    const _result =
      reduced ?
<<<<<<< HEAD
        await procReducedPdfGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfOnly) :
        await procOrigGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfOnly);
=======
        await procReducedPdfGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, type) :
        await procOrigGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, type);
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
    console.log(`generateGoogleDriveListingExcel ${JSON.stringify(_result)}`)
    return {
      ..._result,
    };
  }
  catch (err) {
    console.log('Error', err);
    return {
      msg: `Error ${err}`,
      success: false
    }
  }
}

// (() => {
//   const driveLink = "https://drive.google.com/drive/u/0/folders/1yFQaR1FeKN3WEkEGCVhF5PsalQ6-EL2C";
//   procOrigGoogleDrive(driveLink, "Treasures 66");
// })();
//yarn run catalog
