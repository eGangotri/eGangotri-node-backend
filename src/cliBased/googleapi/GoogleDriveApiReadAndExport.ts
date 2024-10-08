import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAndGenerateCSVAndExcel, listFolderContentsAndGenerateExcelV2ForPdfRenamer } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { isValidDriveId } from './Utils';
import { PDF_TYPE } from './_utils/constants';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", pdfRenamerXlV2 = false, type = PDF_TYPE) {
  if (pdfRenamerXlV2) {
    const res = await listFolderContentsAndGenerateExcelV2ForPdfRenamer(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_googleDriveExcels`,
      folderName, ignoreFolder, type);
    return res;
  }
  else {
    const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_googleDriveExcels`,
      folderName, ignoreFolder, type);
    return res;
  }
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string, ignoreFolder = "", pdfRenamerXlV2 = false, type = PDF_TYPE) {
  if (pdfRenamerXlV2) {
    const res = await listFolderContentsAndGenerateExcelV2ForPdfRenamer(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, type);
    return res;
  }
  else {
    const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, type);
    return res;
  }
}

export const generateGoogleDriveListingExcel = async (driveLinkOrFolderID: string,
  folderName: string,
  reduced = false,
  ignoreFolder = "",
  pdfRenamerXlV2 = false,
  type = PDF_TYPE) => {
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
        await procReducedPdfGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfRenamerXlV2, type) :
        await procOrigGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfRenamerXlV2, type);
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
