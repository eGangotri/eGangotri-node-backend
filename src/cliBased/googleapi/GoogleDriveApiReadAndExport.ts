import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAndGenerateCSVAndExcel, listFolderContentsAndGenerateExcelV2ForPdfRenamer, listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { isValidDriveId } from './Utils';
import { PDF_TYPE } from './_utils/constants';
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { getFolderName } from './_utils/GoogleDriveUtil';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();
export const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;

export const getFolderNameFromGDrive = async (driveLinkOrFolderID: string) => {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  return getFolderName(folderId, drive);
};

export async function getGDriveContentsAsJson(driveLinkOrFolderID: string,
  umbrellaFolder: string = "",
  ignoreFolder = "",
  fileType = PDF_TYPE) {

  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  console.log(`folderId: ${folderId}`)
  const _data = await listFolderContentsAsArrayOfData(folderId, drive, umbrellaFolder,
    ignoreFolder, fileType);
  return _data;
}

async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string,
  ignoreFolder = "", pdfRenamerXlV2 = false, type = PDF_TYPE, rowCounterController = "") {
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

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string,
  folderName: string, ignoreFolder = "", pdfRenamerXlV2 = false
  , type = PDF_TYPE, rowCounterController = "") {
  if (pdfRenamerXlV2) {
    const res = await listFolderContentsAndGenerateExcelV2ForPdfRenamer(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, type, rowCounterController);
    return res;
  }
  else {
    const res = await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive,
      `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName, ignoreFolder, type, rowCounterController);
    return res;
  }
}

export const generateGoogleDriveListingExcel = async (driveLinkOrFolderID: string,
  folderName: string,
  reduced = false,
  ignoreFolder = "",
  pdfRenamerXlV2 = false,
  type = PDF_TYPE,
  rowCounterController = "") => {
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
        await procReducedPdfGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfRenamerXlV2, type, rowCounterController) :
        await procOrigGoogleDrive(driveLinkOrFolderID, folderName, ignoreFolder, pdfRenamerXlV2, type, rowCounterController);
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
//pnpm run catalog
