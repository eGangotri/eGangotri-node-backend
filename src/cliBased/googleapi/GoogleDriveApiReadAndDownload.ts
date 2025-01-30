import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadFileFromGoogleDrive } from '../pdf/downloadFile';
import { getFolderInSrcRootForProfile } from '../../archiveUpload/ArchiveProfileUtils';
import fs from 'fs';
import path from 'path';
import * as fsExtra from 'fs-extra';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, DOWNLOAD_FAILED_COUNT, resetDownloadCounters } from '../../cliBased/pdf/utils';
import { insertEntryForGDriveUploadHistory, updateEntryForGDriveUploadHistory } from '../../services/GdriveDownloadRecordService';
import { getAllPdfsInFolders, getDirectoriesWithFullPath } from '../../imgToPdf/utils/Utils';
import { addHeaderAndFooterToPDF } from '../../pdfHeaderFooter';
import { isValidPath } from '../../utils/utils';
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { PDF_TYPE } from './_utils/constants';
import { GDriveDownloadHistoryStatus } from '../../utils/constants';

export const MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE = 200;
// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllFilesFromGDrive(driveLinkOrFolderID: string,
  folderName: string,
  fileDumpFolder: string,
  ignoreFolder = "",
  fileType = PDF_TYPE,
  gDriveDownloadTaskId: string) {
  const folderId = extractGoogleDriveId(driveLinkOrFolderID)
  console.log(`folderId: ${folderId}`)
  const googleDriveData = await listFolderContentsAsArrayOfData(folderId,
    drive,
    folderName,
    ignoreFolder, fileType);
  console.log(`googleDriveData(${googleDriveData.length}): ${JSON.stringify(googleDriveData)}`);
  const dataLength = googleDriveData.length;
  const maxLimit = MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE;
  if (dataLength > maxLimit) {
    console.log(`restriction to ${maxLimit} items only for now. Cannot continue`);
    const msg = `restriction to ${maxLimit} items only for now. Link has ${googleDriveData.length} items Cannot continue`

    updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, GDriveDownloadHistoryStatus.Failed, msg, { totalPdfsToDownload: googleDriveData.length});
    return {
      totalPdfsToDownload: googleDriveData.length,
      success: false,
      msg
    }
  }

  const promises = googleDriveData.map(_data => {
    console.log(`googleDriveData.map(_data: ${JSON.stringify(_data)}}`);
    const fileDumpWithPathAppended = fileDumpFolder + path.sep + _data.parents;
    console.log(`fileDumpWithPathAppended: ${fileDumpWithPathAppended}`);
    if (!fs.existsSync(fileDumpWithPathAppended)) {
      fsExtra.ensureDirSync(fileDumpWithPathAppended);
    }

    return downloadFileFromGoogleDrive(_data.googleDriveLink,
      fileDumpWithPathAppended, _data.fileName, _data?.fileSizeRaw, gDriveDownloadTaskId)
  });
  const results = await Promise.all(promises);
  const resultsAsString = results.map((result: any) => JSON.stringify(result)).join(",");
  updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, "completed", resultsAsString);

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
    console.log(`Error ${JSON.stringify(err)}`)
    return {
      "mdg": "failed" + err,
      status: false
    }
  }
}

export const downloadFromGoogleDriveToProfile = async (driveLinkOrFolderId: string,
  profileOrPath: string,
  ignoreFolder = "",
  fileType = PDF_TYPE) => {
  const fileDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadFromGoogleDriveToProfile:fileDumpFolder ${fileDumpFolder}`)
  let gDriveDownloadTaskId = "0"
  try {
    if (fs.existsSync(fileDumpFolder)) {
      resetDownloadCounters();
      gDriveDownloadTaskId = await insertEntryForGDriveUploadHistory(driveLinkOrFolderId, profileOrPath, fileType, fileDumpFolder, "Initiated Downloading");
      const _results = await getAllFilesFromGDrive(driveLinkOrFolderId, "",
        fileDumpFolder, ignoreFolder, fileType, gDriveDownloadTaskId);

      console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT}`);
      console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT}`);
      const _resp = {
        totalPdfsToDownload: _results.totalPdfsToDownload,
        status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT + DOWNLOAD_FAILED_COUNT} made it`,
        success_count: DOWNLOAD_COMPLETED_COUNT,
        error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT,
        dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT}
        ${DOWNLOAD_FAILED_COUNT > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
        ..._results
      }
      console.log(`_resp : ${JSON.stringify(_resp)}`);
      updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, JSON.stringify(_resp), GDriveDownloadHistoryStatus.Completed,_resp);
      return _resp;
    }
    console.log(`No corresponding folder ${fileDumpFolder} to profile ${profileOrPath} exists`)
    return {
      "success": false,
      msg: `No corresponding folder to profile (${profileOrPath}) exists`
    }
  }
  catch (err) {
    console.log(`downloadFromGoogleDriveToProfile:Error (${fileDumpFolder}) ${JSON.stringify(err)}`)
    const _resp =  {
      status: `${DOWNLOAD_COMPLETED_COUNT} out of ${DOWNLOAD_COMPLETED_COUNT + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT + DOWNLOAD_FAILED_COUNT} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT,
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT,
      dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT}
      ${DOWNLOAD_FAILED_COUNT > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
      "error": `downloadFromGoogleDriveToProfile:Error (${fileDumpFolder}) ${JSON.stringify(err)}`
    }
    updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,err, GDriveDownloadHistoryStatus.Failed, _resp);
    return _resp
  }
}
