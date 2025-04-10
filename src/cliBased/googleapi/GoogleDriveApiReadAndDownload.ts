import path from 'path';
import { _credentials } from './_utils/credentials_googleapi';
import { listFolderContentsAsArrayOfData } from './service/GoogleApiService';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import { downloadFileFromGoogleDrive } from '../pdf/downloadFile';
import { getFolderInSrcRootForProfile } from '../../archiveUpload/ArchiveProfileUtils';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT, DOWNLOAD_FAILED_COUNT } from '../../cliBased/pdf/utils';
import { insertEntryForGDriveUploadHistory, updateEntryForGDriveUploadHistory } from '../../services/GdriveDownloadRecordService';
import { getAllPdfsInFolders, getDirectoriesWithFullPath } from '../../imgToPdf/utils/Utils';
import { addHeaderAndFooterToPDF } from '../../pdfHeaderFooter';
import { isValidPath } from "../../utils/FileUtils";
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { PDF_TYPE, FOLDER_MIME_TYPE } from './_utils/constants';
import { GDriveDownloadHistoryStatus } from '../../utils/constants';
import { checkFolderExistsAsync, createFolderIfNotExistsAsync } from '../../utils/FileUtils';
import { getFolderNameFromGDrive } from './GoogleDriveApiReadAndExport';

export const MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE: number = Number(process.env.MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE || 200);
// Create a new Google Drive instance
const drive = getGoogleDriveInstance();

async function dwnldAllFilesFromGDrive(driveLinkOrFolderID: string,
  folderName: string,
  fileDumpFolder: string,
  ignoreFolder = "",
  fileType = PDF_TYPE,
  gDriveDownloadTaskId: string,
  downloadCounterController = "") {
  const fileId = extractGoogleDriveId(driveLinkOrFolderID)
  console.log(`fileId: ${fileId}`)

  // First check if it's a file
  try {
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, parents, webViewLink'
    });

    if (file.data && file.data.mimeType !== FOLDER_MIME_TYPE) {
      // It's a single file, process it directly
      const fileData = {
        fileName: file.data.name || "",
        googleDriveLink: file.data.webViewLink || "",
        fileSizeRaw: file.data.size || "0",
        parents: "" // For single files, we don't need parent folder structure
      };

      await createFolderIfNotExistsAsync(fileDumpFolder);

      await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
        `Started download of single file: ${fileData.fileName}`,
        GDriveDownloadHistoryStatus.InProgress);

      const result = await downloadFileFromGoogleDrive(
        fileData.googleDriveLink,
        fileDumpFolder,
        fileData.fileName,
        fileData.fileSizeRaw,
        gDriveDownloadTaskId,
        downloadCounterController
      );

      const resultAsString = JSON.stringify(result);
      await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
        resultAsString,
        GDriveDownloadHistoryStatus.Completed);

      return {
        totalPdfsToDownload: 1,
        results: [result]
      };
    }
  } catch (err) {
    if (err?.response?.status !== 404) {
      await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
        JSON.stringify(err),
        GDriveDownloadHistoryStatus.Failed);
      throw err;
    }
  }

  // If we get here, it's a folder or the file wasn't found, try the folder logic
  const googleDriveData = await listFolderContentsAsArrayOfData(fileId,
    drive,
    folderName,
    ignoreFolder, fileType);
  console.log(`googleDriveData(${googleDriveData.length}): ${JSON.stringify(googleDriveData)}`);
  const dataLength = googleDriveData.length;
  const maxLimit = MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE;
  if (dataLength > maxLimit) {
    console.log(`restriction to ${maxLimit} items only for now. Cannot continue`);
    const msg = `restriction to ${maxLimit} items only for now. Link has ${googleDriveData.length} items Cannot continue`

    await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
      msg, GDriveDownloadHistoryStatus.Failed, { totalPdfsToDownload: googleDriveData.length });
    return {
      totalPdfsToDownload: googleDriveData.length,
      success: false,
      msg
    }
  }

  await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
    `Started download with ${googleDriveData.length} items`,
    GDriveDownloadHistoryStatus.InProgress);

  const promises = googleDriveData.map(async (_data) => {
    console.log(`googleDriveData.map(_data: ${JSON.stringify(_data)}}`);
    const fileDumpWithPathAppended = fileDumpFolder + path.sep + _data.parents;
    console.log(`fileDumpWithPathAppended: ${fileDumpWithPathAppended}`);
    await createFolderIfNotExistsAsync(fileDumpWithPathAppended);

    return downloadFileFromGoogleDrive(_data.googleDriveLink,
      fileDumpWithPathAppended, _data.fileName, _data?.fileSizeRaw, gDriveDownloadTaskId, downloadCounterController)
  });
  const results = await Promise.all(promises);
  const resultsAsString = results.map((result: any) => JSON.stringify(result)).join(",");
  await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
    resultsAsString,
    GDriveDownloadHistoryStatus.Completed
  );

  return {
    totalPdfsToDownload: googleDriveData.length,
    results
  }
}

export const addHeaderFooterToPDFsInProfile = async (profile: string) => {
  const pdfDumpFolder = getFolderInSrcRootForProfile(profile)
  console.log(`addHeaderFooterToPDFsInProfile:pdfDumpFolder ${pdfDumpFolder}`)
  try {
    if (await checkFolderExistsAsync(pdfDumpFolder)) {
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
  fileType = PDF_TYPE,
  downloadCounterController = "",
  gDriveDownloadTaskId: string = "") => {
  const fileDumpFolder = isValidPath(profileOrPath) ? profileOrPath : getFolderInSrcRootForProfile(profileOrPath);
  console.log(`downloadFromGoogleDriveToProfile:fileDumpFolder ${fileDumpFolder}`)
  try {
    if (await checkFolderExistsAsync(fileDumpFolder)) {
      const gDriveRootFolder = await getFolderNameFromGDrive(driveLinkOrFolderId) || "";
      console.log(`downloadFromGoogleDriveToProfile:gDriveRootFolder ${gDriveRootFolder}`)

      if (gDriveDownloadTaskId === "") {
        gDriveDownloadTaskId = await insertEntryForGDriveUploadHistory(driveLinkOrFolderId, profileOrPath,
          fileType, fileDumpFolder,
          gDriveRootFolder, ignoreFolder, `Initiated Downloading ${driveLinkOrFolderId} /${gDriveRootFolder}`);
      }
      const _results = await dwnldAllFilesFromGDrive(driveLinkOrFolderId, "",
        fileDumpFolder, ignoreFolder, fileType, gDriveDownloadTaskId, downloadCounterController);

      console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT(downloadCounterController)}`);
      console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController)}`);
      const _resp = {
        totalPdfsToDownload: _results.totalPdfsToDownload,
        status: `${DOWNLOAD_COMPLETED_COUNT(downloadCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT(downloadCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController) + DOWNLOAD_FAILED_COUNT(downloadCounterController)} made it`,
        success_count: DOWNLOAD_COMPLETED_COUNT(downloadCounterController),
        error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController),
        dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT(downloadCounterController)}
        ${DOWNLOAD_FAILED_COUNT(downloadCounterController) > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
        ..._results,
        gDriveDownloadTaskId
      }
      console.log(`_resp : ${JSON.stringify(_resp)}`);
      await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId,
        JSON.stringify(_resp),
        GDriveDownloadHistoryStatus.Completed, _resp);
      return _resp;
    }
    else {
      console.log(`No corresponding folder ${fileDumpFolder} to profile ${profileOrPath} exists`)
      return {
        "success": false,
        msg: `No corresponding folder to profile (${profileOrPath}) exists`
      }
    }
  }
  catch (err) {
    console.log(`downloadFromGoogleDriveToProfile:Error (${fileDumpFolder}) ${JSON.stringify(err)}`)
    const _resp = {
      status: `${DOWNLOAD_COMPLETED_COUNT(downloadCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT(downloadCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController) + DOWNLOAD_FAILED_COUNT(downloadCounterController)} made it`,
      success_count: DOWNLOAD_COMPLETED_COUNT(downloadCounterController),
      error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadCounterController),
      dl_wrong_size_count: `${DOWNLOAD_FAILED_COUNT(downloadCounterController)}
      ${DOWNLOAD_FAILED_COUNT(downloadCounterController) > 0 ? "Google Drive Quota may have been filled.Typically takes 24 Hours to reset." : ""}`,
      "error": `downloadFromGoogleDriveToProfile:Error (${fileDumpFolder}) ${JSON.stringify(err)}`
    }
    await updateEntryForGDriveUploadHistory(gDriveDownloadTaskId, err,
      GDriveDownloadHistoryStatus.Failed, _resp);
    return _resp
  }
}
