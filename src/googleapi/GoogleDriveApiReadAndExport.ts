import { _credentials } from './_utils/credentials_gitignore';
import { listFolderContentsAndGenerateCSVAndExcel, listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';


// Create a new Google Drive instance
const drive = getGoogleDriveInstance();


async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName);
}

async function getAllPdfs(driveLinkOrFolderID: string, folderName: string) {
  const googleDriveData = await listFolderContentsAsArrayOfData(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
  if(googleDriveData.length > 10){
    console.log("restriction to 10 items only for now. exiting")
    process.exit(0);
  }
  googleDriveData.map((x) => downloadPdfFromGoogleDrive(x.googleDriveLink))
}

//const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;
const EXPORT_ROOT_FOLDER = `C:\\Users\\chetan\\Documents\\_personal\\`;

//all entries must have await in front
(async () => {
  await getAllPdfs("1eJnYKRgZIyPO2s-BgsJ4ozhCEuH3i_lQ",
    'procFolderSvshastri3');
  ////await procReducedPdfGoogleDrive("1Nox5h2CYgIrGcd73JswHk0_q05y0W-b7", 'Treasures60');
})();

//yarn run catalog
