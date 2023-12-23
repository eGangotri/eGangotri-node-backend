import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadPdfFromGoogleDrive } from '../pdf/downloadPdf';
import { extractGoogleDriveId } from './_utils/GoogleDriveUtil';
import { getFolderInSrcRootForProfile } from '../../cliBased/utils';
import fs from 'fs';
import path from 'path';
import * as fsExtra from 'fs-extra';
import { countBy } from 'lodash';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_FAILED_COUNT, resetDownloadCounters } from '../../cliBased/pdf/utils';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllPdfs(driveLinkOrFolderID: string, folderName: string, pdfDumpFolder: string) {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  console.log(`folderId: ${folderId}`)
  const googleDriveData = await listFolderContentsAsArrayOfData(folderId,
    drive,
    `${pdfDumpFolder}${path.sep}_googleDriveExcels`,
    folderName,
    "proc");

  const dataLength = googleDriveData.length;
  if (dataLength > 100) {
    console.log("restriction to 100 items only for now. exiting")
    process.exit(0);
  }
  const promises = googleDriveData.map(_data => {
    console.log(`_data: ${JSON.stringify(_data)}}`);
    const pdfDumpWithPathAppended = pdfDumpFolder + path.sep + _data.parents;
    console.log(`pdfDumpFolder: ${pdfDumpWithPathAppended}`);
    if (!fs.existsSync(pdfDumpWithPathAppended)) {
      fsExtra.ensureDirSync(pdfDumpWithPathAppended);
    }
    return downloadPdfFromGoogleDrive(_data.googleDriveLink,
      pdfDumpWithPathAppended, _data.fileName, dataLength)
  });
  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: googleDriveData.length,
    results
  }
}


export const downloadPdfFromGoogleDriveToProfile = async (driveLinkOrFolderId: string, profile: string) => {
  const pdfDumpFolder = getFolderInSrcRootForProfile(profile)
  console.log(`pdfDumpFolder ${pdfDumpFolder}`)
  try {
    if (fs.existsSync(pdfDumpFolder)) {
      resetDownloadCounters()
      const _results = await getAllPdfs(driveLinkOrFolderId, "",
        pdfDumpFolder);

      console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT}`);
      console.log(`Error count: ${DOWNLOAD_FAILED_COUNT}`);
      const _resp = {
        status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_FAILED_COUNT} made it`,
        success_count: DOWNLOAD_COMPLETED_COUNT,
        error_count: DOWNLOAD_FAILED_COUNT,
        ..._results
      }
      console.log(`_resp : ${JSON.stringify(_resp)}`);
      return _resp;
    }
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profile} exists`)
    return {
      "status": "failed"
    }
  }
  catch (err) {
    console.log(`Error ${err}`)
    return {
      "status": "failed" + err
    }
  }
}

//all entries must have await in front
// (async () => {
//   const args = process.argv.slice(2);
//   console.log("Command-line arguments:", args);
//   const _url = args[0];
//   const _profile = args[1];
//   await downloadPdfFromGoogleDriveToProfile(_url, _profile);
// })();

//yarn run downloadFromGoogle "google url" "TMP"
