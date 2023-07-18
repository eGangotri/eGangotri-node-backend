import { drive_v3 } from 'googleapis';
import { sizeInfo } from '../../mirror/FrontEndBackendCommonCode';
import { dataToXslx } from '../_utils/ExcelUtils';
import { EXPORT_DEST_FOLDER } from '../GoogleDriveApiReadAndExport';
import { FOLDER_MIME_TYPE, PDF_MIME_TYPE } from '../_utils/constants';
import { GoogleApiData } from '../types';
import { createFileNameWithPathForExport, extractFolderId, getFolderName, getFolderPathRelativeToRootFolder } from '../_utils/GoogleDriveUtil';


let ROW_COUNTER = 0;
let ROOT_FOLDER_NAME = ""

export async function listFolderContentsAndGenerateCSVAndExcel(_folderId: string, drive: drive_v3.Drive, umbrellaFolder: string = "") {
    const folderId = extractFolderId(_folderId)
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : await getFolderName(folderId, drive) || "";
    ROOT_FOLDER_NAME = await getFolderName(folderId, drive) || "";
    console.log(`drive api folder extracTion process initiated: \
    from (${_umbrellaFolder}) ${_folderId} destined to ${EXPORT_DEST_FOLDER}\n`)

    const googleDrivePdfData: Array<GoogleApiData> = []
    let idFolderNameMap = new Map<string, string>();

    await listFolderContents(folderId, drive, umbrellaFolder, googleDrivePdfData,idFolderNameMap);

    const fileNameWithPath = createFileNameWithPathForExport(folderId, umbrellaFolder) + `_${ROW_COUNTER}`;

    //writeDataToCSV(googleDrivePdfData, `${fileNameWithPath}.csv`)
    // Convert data to XLSX
    dataToXslx(googleDrivePdfData, `${fileNameWithPath}.xlsx`);
}

export async function listFolderContents(folderId: string, drive: drive_v3.Drive, umbrellaFolder:
     string, googleDrivePdfData: GoogleApiData[],idFolderNameMap:Map<string,string>) {

    if (!idFolderNameMap.has(folderId)) {
        const folderPath = await getFolderPathRelativeToRootFolder(folderId, drive)
        var index = folderPath.indexOf(ROOT_FOLDER_NAME);
        const _trimmed = folderPath.slice(index);
        console.log(`folderPath ${folderPath} : ${_trimmed}: ${ROOT_FOLDER_NAME}`)
        idFolderNameMap.set(folderId, _trimmed)
    }

    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and (mimeType='${PDF_MIME_TYPE}' or mimeType='${FOLDER_MIME_TYPE}')`,
            fields: 'files(id, name, mimeType,size,parents,webViewLink,thumbnailLink,createdTime)',
            pageSize: 1000, // Increase the page size to retrieve more files if necessary
        });
        const files = response.data.files;
        if (files && files.length) {
            for (const file of files) {
                addFileMetadataToArray(file, folderId,googleDrivePdfData, idFolderNameMap);
                if (file.mimeType === FOLDER_MIME_TYPE) {
                    await listFolderContents(file?.id || '', drive, umbrellaFolder, googleDrivePdfData,idFolderNameMap); // Recursively call the function for subfolders
                }
            }
        } else {
            console.log('No files found in the folder.');
        }
    } catch (err) {
        console.error('Error retrieving folder contents:', err);
    }
}

export const addFileMetadataToArray = (file: drive_v3.Schema$File, folderId:string,
    googleDrivePdfData: GoogleApiData[],
    idFolderNameMap: Map<string, string>) => {

    const fileName = file.name || "";
    const filemimeType = file.mimeType || "";
    const fileSizeRaw = file.size || "0";
    const fileSize = parseInt(fileSizeRaw);
    const webViewLink = file.webViewLink || "/"
    const thumbnailLink = file.thumbnailLink || "/"
    const createdTime = file.createdTime || "/"
    const _parents = idFolderNameMap.get(folderId) || "/"

    if (filemimeType === PDF_MIME_TYPE) {
        googleDrivePdfData.push({
            index: ++ROW_COUNTER,
            fileName: fileName,
            googleDriveLink: webViewLink,
            sizeInfo: sizeInfo(fileSize),
            fileSizeRaw: fileSizeRaw,
            parents: _parents,
            createdTime: createdTime,
            thumbnailLink: thumbnailLink,
        });
        
    console.log(` ${ROW_COUNTER}, ${fileName},${fileSize} ,${createdTime} "${_parents}"
    ${thumbnailLink}
     ${webViewLink} `);
    }
}