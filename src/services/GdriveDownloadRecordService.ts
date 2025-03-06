import { QuickStatus } from 'models/GDriveDownloadHistorySchema';
import { GLOBAL_SERVER_NAME } from '../db/connection';
import { GDriveDownloadHistoryStatus } from 'utils/constants';

const GDRIVE_DOWNLOAD_HISTORY_PATH = `${GLOBAL_SERVER_NAME}/gDriveDownloadRoute`;

export const insertEntryForGDriveUploadHistory =
 async (driveLinkOrFolderId: string,
  profileOrPath: string, fileType: string,
   fileDumpFolder: string, msg: string) => {
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
        msg,
        files: []
      })
    }
  )
  if (!insertInDB.ok) {
    console.log(`Failed to create GDriveDownload:`, fileDumpFolder);
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
  msg: string,
   status: GDriveDownloadHistoryStatus,
    quickStatus: QuickStatus = {}) => {
  const params = { msg, status };
  if (quickStatus && quickStatus?.status?.length > 0) {
    params['quickStatus'] = quickStatus;
  }
  console.log(`params ${params} quickStatus${JSON.stringify(quickStatus)}`);
  try {
    const response = await fetch(`${GDRIVE_DOWNLOAD_HISTORY_PATH}/updateGDriveDownload/${gDriveDownloadTaskId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    );
    if (!response.ok) {
      console.log(`updateGDriveDownload/HTTP error! status: ${response.status}`);
    }
    console.log(`updateEntryForGDriveUploadHistory/${msg}/
      ${status}/
      ${JSON.stringify(quickStatus)} with ${JSON.stringify(response)}`);
  } catch (error) {
    console.error(`updateEntryForGDriveUploadHistory:error/${msg}/${status}: ${JSON.stringify(error)}`);
    throw error; // Re-throw to allow caller to handle
  }
};

export const _updateEmbeddedFileByFileName = async (gDriveDownloadTaskId: string,
  fileName: string, 
  status: string, 
  msg: string, 
  filePath: string = "") => {
  const params = setParams(msg, status, fileName, filePath);
  console.log(`_updateEmbeddedFileByFileName/1/with 
    ${JSON.stringify(params)}`);
  try {
    const response = await fetch(`${GDRIVE_DOWNLOAD_HISTORY_PATH}/updateEmbeddedFileByFileNameV2/${gDriveDownloadTaskId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    );
    if (!response.ok) {
      console.log(`_updateEmbeddedFileByFileName:HTTP error! status: ${response.status} `, fileName);
    }
  } catch (error) {
    console.error(`_updateEmbeddedFileByFileName:error/${JSON.stringify(params)}: ${JSON.stringify(error)}`);
    throw error; // Re-throw to allow caller to handle
  }
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