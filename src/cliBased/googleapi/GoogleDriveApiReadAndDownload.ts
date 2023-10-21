import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';
import { extractGoogleDriveId } from './_utils/GoogleDriveUtil';
import { getFolderInSrcRootForProfile } from '../../cliBased/utils';
import fs from 'fs';
import path from 'path';


// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

const EXPORT_ROOT_FOLDER = `D:\\_playground\\_dwnldPlayground\\`;

async function getAllPdfs(driveLinkOrFolderID: string, folderName: string, pdfDumpFolder: string) {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  const googleDriveData = await listFolderContentsAsArrayOfData(folderId,
    drive,
    `${pdfDumpFolder}${path.sep}_googleDriveExcels`,
    folderName,
    "proc");

  if (googleDriveData.length > 100) {
    console.log("restriction to 100 items only for now. exiting")
    process.exit(0);
  }
  googleDriveData.map((_data) => downloadPdfFromGoogleDrive(_data.googleDriveLink, pdfDumpFolder))
}


export const downloadPdfFromGoogleDriveToProfile = async (driveLinkOrFolderId: string, profile: string) => {
  const pdfDumpFolder = getFolderInSrcRootForProfile(profile)
  console.log(`pdfDumpFolder ${pdfDumpFolder}`)
  if (fs.existsSync(pdfDumpFolder)) {
    await getAllPdfs(driveLinkOrFolderId, "",
      pdfDumpFolder);
  }
  else {
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profile} exists`)
  }
}


//all entries must have await in front
(async () => {
  const _url = "https://drive.google.com/drive/folders/1bBScm1NxfJQD16Ry-oG7XsSbTYFi0AMY?usp=share_link"
  await downloadPdfFromGoogleDriveToProfile(_url, 'TMP');
})();

//yarn run downloadFromGoogle
