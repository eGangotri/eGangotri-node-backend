import { GLOBAL_SERVER_NAME } from '../db/connection';

export const updateEntryForGDriveUploadHistory = async (gDriveDownloadTaskId: string,
  msg: string, status: string, fileName: string = "", filePath = "") => {
  fetch(`${GLOBAL_SERVER_NAME}/gDriveDownloadRoute/updateGDriveDownload/${gDriveDownloadTaskId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msg,
        status
      })
    }
  ).then((response) => {
    console.log(`updateGDriveDownload/completed/response with  ${JSON.stringify(response)}`);
  }).catch((error) => {
    console.log(`updateGDriveDownload/completed/error: ${JSON.stringify(error)}`);
  });

};

export const insertEntryForGDriveUploadHistory = async (driveLinkOrFolderId: string,
  profileOrPath: string, fileType: string, fileDumpFolder: string, msg: string) => {
  const insertInDB = await fetch(`${GLOBAL_SERVER_NAME}/gDriveDownloadRoute/createGDriveDownload`,
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
  return insertInDB;
}


export const updateEmbeddedFileByFileName = async (gDriveDownloadTaskId: string, 
  fileName: string, status: string, msg: string, filePath: string = "") => {
  fetch(`${GLOBAL_SERVER_NAME}/gDriveDownloadRoute/updateEmbeddedFileByFileName/${gDriveDownloadTaskId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msg: msg,
        status: status,
        fileName,
        filePath
      })
    }
  )
}
