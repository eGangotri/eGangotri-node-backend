import { _credentials } from './_utils/credentials_gitignore';
import { listFolderContentsAndGenerateCSVAndExcel } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';


// Create a new Google Drive instance
const drive = getGoogleDriveInstance();


async function procOrigGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_googleDriveExcels`, folderName);
}

async function procReducedPdfGoogleDrive(driveLinkOrFolderID: string, folderName: string) {
  await listFolderContentsAndGenerateCSVAndExcel(driveLinkOrFolderID, drive, `${EXPORT_ROOT_FOLDER}_catReducedDrivePdfExcels`, folderName);
}

//const EXPORT_ROOT_FOLDER = `C:\\_catalogWork\\_collation\\`;
const EXPORT_ROOT_FOLDER = `C:\\Users\\chetan\\Documents\\_personal\\`;

//all entries must have await in front
(async () => {
  await procOrigGoogleDrive("https://drive.google.com/drive/folders/1T4orchOqirs-vPc-yydnsfsmHhvszl92?usp=drive_link",
    'procFolderSvshastri2');
  ////await procReducedPdfGoogleDrive("1Nox5h2CYgIrGcd73JswHk0_q05y0W-b7", 'Treasures60');
})();

//yarn run catalog
