import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';


// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllPdfs(driveLinkOrFolderID: string, folderName: string) {
  const googleDriveData = await listFolderContentsAsArrayOfData(driveLinkOrFolderID,
    drive,
    `${EXPORT_ROOT_FOLDER}_googleDriveExcels`,
    folderName,
    "proc");

  if (googleDriveData.length > 100) {
    console.log("restriction to 100 items only for now. exiting")
    process.exit(0);
  }
  googleDriveData.map((x) => downloadPdfFromGoogleDrive(x.googleDriveLink))
}

//const EXPORT_ROOT_FOLDER = `C:\\Users\\chetan\\Documents\\_personal\\`;
const EXPORT_ROOT_FOLDER = `D:\\_playground\\_dwnldPlayground\\`;
//all entries must have await in front
(async () => {
  await getAllPdfs("https://drive.google.com/drive/folders/1KtH4BJyiRcN0oQd_8tlI6V8uTPgie1FM?usp=drive_link",
    'SalimSaliqSahib');
})();

//yarn run downloadFromGoogle
