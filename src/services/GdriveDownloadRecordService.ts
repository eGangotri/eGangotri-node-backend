import { QuickStatus } from 'models/GDriveDownloadHistorySchema';
import { GLOBAL_SERVER_NAME } from '../db/connection';

const GDRIVE_DOWNLOAD_HISTORY_PATH = `${GLOBAL_SERVER_NAME}/gDriveDownloadRoute`;

export const insertEntryForGDriveUploadHistory = async (driveLinkOrFolderId: string,
  profileOrPath: string, fileType: string, fileDumpFolder: string, msg: string) => {
  const insertInDB = await fetch(`${GDRIVE_DOWNLOAD_HISTORY_PATH}/createGDriveDownload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        googleDriveLink: driveLinkOrFolderId,
        profileNameOrAbsPath: profileOrPath,
        downloadType: fileType,
        fileDumpFolder,
        msg: msg,
        files: []
      })
    }
  )
  if (!insertInDB.ok) {
    console.log(`Failed to create GDriveDownload`);
    return "0";
  }
  else {
    const responseData = await insertInDB.json();
    const gDriveDownloadTaskId = responseData._id;
    console.log(`gDriveDownloadTaskId: ${JSON.stringify(gDriveDownloadTaskId)}`);
    return gDriveDownloadTaskId;
  }
}

export const updateEntryForGDriveUploadHistory = async (gDriveDownloadTaskId: string,
  msg: string, status: string, quickStatus: QuickStatus = {}) => {
  const params = { msg, status };
  if (quickStatus && quickStatus?.status?.length > 0) {
    params['quickStatus'] = quickStatus;
  }
  fetch(`${GDRIVE_DOWNLOAD_HISTORY_PATH}/updateGDriveDownload/${gDriveDownloadTaskId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }
  ).then((response) => {
    console.log(`updateEntryForGDriveUploadHistory/${msg}/${status}/${params} with ${JSON.stringify(response)}`);
  }).catch((error) => {
    console.log(`updateEntryForGDriveUploadHistory:error/${msg}/${status}: ${JSON.stringify(error)}`);
  });
};

export const updateEmbeddedFileByFileName = async (gDriveDownloadTaskId: string,
  fileName: string, status: string, msg: string, filePath: string = "") => {
  const params = setParams(msg, status, fileName, filePath);

  fetch(`${GDRIVE_DOWNLOAD_HISTORY_PATH}/updateEmbeddedFileByFileName/${gDriveDownloadTaskId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    }
  ).then((response) => {
    console.log(`updateEmbeddedFileByFileName/${msg}/${status} with ${JSON.stringify(response)}`);
  }).catch((error) => {
    console.log(`updateEmbeddedFileByFileName:error/${msg}/${status}: ${JSON.stringify(error)}`);
  });
}

const setParams = (msg: string, status: string, fileName: string, filePath: string) => {
  const params = {
    msg,
    status
  }
  if (fileName) {
    params['fileName'] = fileName;
  }
  if (filePath) {
    params['filePath'] = filePath;
  }
  return params;
} 