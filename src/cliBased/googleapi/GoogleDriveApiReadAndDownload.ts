import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';
import { extractGoogleDriveId } from './_utils/GoogleDriveUtil';


// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllPdfs(driveLinkOrFolderID: string, folderName: string) {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  const googleDriveData = await listFolderContentsAsArrayOfData(folderId,
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

const EXPORT_ROOT_FOLDER = `D:\\_playground\\_dwnldPlayground\\`;
//all entries must have await in front
(async () => {
  await getAllPdfs("https://drive.google.com/drive/folders/1XkiB0iLlbufmbPhIwEl2f17a89cW-Dlu?usp=drive_link",
    'SalimSaliqSahib');
})();

//yarn run downloadFromGoogle
