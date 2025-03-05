import path from 'path';
import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadFileFromGoogleDrive } from '../pdf/downloadFile';
import { getFolderInSrcRootForProfile } from '../../archiveUpload/ArchiveProfileUtils';
import { DOWNLOAD_COMPLETED_COUNT2,  DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2, DOWNLOAD_FAILED_COUNT2, resetDownloadCounters2 } from '../../cliBased/pdf/utils';
import { insertEntryForGDriveUploadHistory, updateEntryForGDriveUploadHistory } from '../../services/GdriveDownloadRecordService';
import { getAllPdfsInFolders, getDirectoriesWithFullPath } from '../../imgToPdf/utils/Utils';
import { addHeaderAndFooterToPDF } from '../../pdfHeaderFooter';
import { isValidPath } from "../../utils/FileUtils";
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { PDF_TYPE } from './_utils/constants';
import { GDriveDownloadHistoryStatus } from '../../utils/constants';
import { checkFolderExistsSync, createFolderIfNotExistsAsync } from '../../utils/FileUtils';

export const MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE = 200;
// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function getAllFilesFromGDrive(driveLinkOrFolderID: string,
  folderName: string,
  fileDumpFolder: string,
  ignoreFolder = "",
  fileType = PDF_TYPE,
  gDriveDownloadTaskId: string,
  downloadCounterController = "") {
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
  
  updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, GDriveDownloadHistoryStatus.InProgress,`Started download with ${googleDriveData.length} items`);

  const promises = googleDriveData.map(async (_data) => {
    console.log(`googleDriveData.map(_data: ${JSON.stringify(_data)}}`);
    const fileDumpWithPathAppended = fileDumpFolder + path.sep + _data.parents;
    console.log(`fileDumpWithPathAppended: ${fileDumpWithPathAppended}`);
    await createFolderIfNotExistsAsync(fileDumpWithPathAppended);

    return downloadFileFromGoogleDrive(_data.googleDriveLink,
      fileDumpWithPathAppended, _data.fileName, _data?.fileSizeRaw, gDriveDownloadTaskId,downloadCounterController)
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
    if (checkFolderExistsSync(pdfDumpFolder)) {
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
  fileType = PDF_TYPE, downloadCounterController = "") => {
  const fileDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadFromGoogleDriveToProfile:fileDumpFolder ${fileDumpFolder}`)
  let gDriveDownloadTaskId = "0"
  try {
    if (checkFolderExistsSync(fileDumpFolder)) {
      gDriveDownloadTaskId = await insertEntryForGDriveUploadHistory(driveLinkOrFolderId, profileOrPath, fileType, fileDumpFolder, "Initiated Downloading");
      const _results = await getAllFilesFromGDrive(driveLinkOrFolderId, "",
        fileDumpFolder, ignoreFolder, fileType, gDriveDownloadTaskId,downloadCounterController);

      console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController)}`);
      console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadCounterController)}`);
      const _resp = {
        totalPdfsToDownload: _results.totalPdfsToDownload,
        status: `${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadCounterController) + DOWNLOAD_FAILED_COUNT2(downloadCounterController)} made it`,
        success_count: DOWNLOAD_COMPLETED_COUNT2(downloadCounterController),
        error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadCounterController),
        dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT2(downloadCounterController)}
        ${DOWNLOAD_FAILED_COUNT2(downloadCounterController) > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
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
      status: `${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT2(downloadCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadCounterController) + DOWNLOAD_FAILED_COUNT2(downloadCounterController)} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT2(downloadCounterController),
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT2(downloadCounterController),
      dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT2(downloadCounterController)}
      ${DOWNLOAD_FAILED_COUNT2(downloadCounterController) > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
      "error": `${err} downloadFromGoogleDriveToProfile:Error (${fileDumpFolder}) ${JSON.stringify(err)}`
    }
    updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,err, GDriveDownloadHistoryStatus.Failed, _resp);
    return _resp
  }
}
