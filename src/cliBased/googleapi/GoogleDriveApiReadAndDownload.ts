import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadFileFromGoogleDrive } from '../pdf/downloadPdf';
import { getFolderInSrcRootForProfile } from '../../cliBased/utils';
import fs from 'fs';
import path from 'path';
import * as fsExtra from 'fs-extra';
import { add, countBy } from 'lodash';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, DOWNLOAD_FAILED_COUNT, resetDownloadCounters } from '../../cliBased/pdf/utils';
import { getAllPdfsInFolders, getDirectoriesWithFullPath } from '../../imgToPdf/utils/Utils';
import { addHeaderAndFooterToPDF } from '../../pdfHeaderFooter';
import { isValidPath } from '../../utils/utils';
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';

// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllFilesFromGDrive(driveLinkOrFolderID: string, folderName: string, pdfDumpFolder: string, ignoreFolder="", pdfOnly = true) {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  console.log(`folderId: ${folderId}`)
  const googleDriveData = await listFolderContentsAsArrayOfData(folderId,
    drive,
    folderName,
    ignoreFolder, pdfOnly);

  const dataLength = googleDriveData.length;
  const maxLimit = 200
  if (dataLength > maxLimit) {
    console.log(`restriction to ${maxLimit} items only for now. Cannot continue`);
    return {
      totalPdfsToDownload: googleDriveData.length,
      success: false,
      msg: `restriction to ${maxLimit} items only for now. Cannot continue`
    }
  }
  const promises = googleDriveData.map(_data => {
    console.log(`_data: ${JSON.stringify(_data)}}`);
    const pdfDumpWithPathAppended = pdfDumpFolder + path.sep + _data.parents;
    console.log(`pdfDumpWithPathAppended: ${pdfDumpWithPathAppended}`);
    if (!fs.existsSync(pdfDumpWithPathAppended)) {
      fsExtra.ensureDirSync(pdfDumpWithPathAppended);
    }

    return downloadFileFromGoogleDrive(_data.googleDriveLink,
      pdfDumpWithPathAppended, _data.fileName, dataLength, _data?.fileSizeRaw)
  });
  const results = await Promise.all(promises);
  return {
    totalPdfsToDownload: googleDriveData.length,
    results
  }
}

export const addHeaderFooterToPDFsInProfile = async (profile: string) => {
  const pdfDumpFolder = getFolderInSrcRootForProfile(profile)
  console.log(`addHeaderFooterToPDFsInProfile:pdfDumpFolder ${pdfDumpFolder}`)
  try {
    if (fs.existsSync(pdfDumpFolder)) {
      const _folders = (await getDirectoriesWithFullPath(pdfDumpFolder)).filter(
        (dir: any) => !dir.match(/ignore/)
      );
      const pdfsInFolders = await getAllPdfsInFolders(_folders);
      for (let pdf of pdfsInFolders) {
        console.log(`pdf: ${pdf}`);
        const _destPdfPath = pdf.replace(".pdf", "-withFooter.pdf");

        addHeaderAndFooterToPDF("", "", pdf, _destPdfPath);
      }
      const _resp = {
        "msg": `Adding Header and Footer to PDFs in profile (${profile})`,
        status: true
      }

      return _resp;
    }
    else {
      return {
        "msg": `No corresponding folder to profile (${profile}) exists`,
        status: false
      }
    }
  }
  catch (err) {
    console.log(`Error ${err}`)
    return {
      "mdg": "failed" + err,
      status: false
    }
  }
}

export const downloadPdfFromGoogleDriveToProfile = async (driveLinkOrFolderId: string, profileOrPath: string, ignoreFolder="", pdfOnly = true) => {
  const pdfDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);

  console.log(`downloadPdfFromGoogleDriveToProfile:pdfDumpFolder ${pdfDumpFolder}`)
  try {
    if (fs.existsSync(pdfDumpFolder)) {
      resetDownloadCounters()
      const _results = await getAllFilesFromGDrive(driveLinkOrFolderId, "",
        pdfDumpFolder, ignoreFolder, pdfOnly);

      console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT}`);
      console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT}`);
      const _resp = {
        status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT + DOWNLOAD_FAILED_COUNT} made it`,
        success_count: DOWNLOAD_COMPLETED_COUNT,
        error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT,
        dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT}
        ${DOWNLOAD_FAILED_COUNT > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
        ..._results
      }
      console.log(`_resp : ${JSON.stringify(_resp)}`);
      return _resp;
    }
    console.log(`No corresponding folder ${pdfDumpFolder} to profile  ${profileOrPath} exists`)
    return {
      "success": false,
      msg: `No corresponding folder to profile (${profileOrPath}) exists`
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
