import { drive_v3 } from 'googleapis';
import { sizeInfo } from '../../mirror/FrontEndBackendCommonCode';
import { dataToXslx } from '../../excel/ExcelUtils';
import { FOLDER_MIME_TYPE, PDF_MIME_TYPE } from '../_utils/constants';
import { GoogleApiData } from '../types';
import { createFileNameWithPathForExport, extractFolderId, getFolderName, getFolderPathRelativeToRootFolder } from '../_utils/GoogleDriveUtil';
import * as _ from 'lodash';
import { GaxiosResponse } from 'gaxios';
import { ellipsis } from '../../mirror/utils';
import * as FileUtils from '../../imgToPdf/utils/FileUtils';

export async function listFolderContentsAsArrayOfData(folderId: string,
    drive: drive_v3.Drive,
    exportDestFolder: string,
    umbrellaFolder: string = "") {

    FileUtils.createFolderIfNotExists(exportDestFolder);
    const rootFolderName = await getFolderName(folderId, drive) || "";
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : rootFolderName;

    console.log(`drive api folder extracTion process initiated: \
    from (${_umbrellaFolder}) ${folderId} \n`)

    const googleDrivePdfData: Array<GoogleApiData> = []
    let idFolderNameMap = new Map<string, string>();

    await listFolderContents(folderId, drive, umbrellaFolder, googleDrivePdfData, idFolderNameMap, rootFolderName);
    return googleDrivePdfData
}

export async function listFolderContentsAndGenerateCSVAndExcel(_folderIdOrUrl: string,
    drive: drive_v3.Drive,
    exportDestFolder: string,
    umbrellaFolder: string = "") {
    const folderId = extractFolderId(_folderIdOrUrl)

    const googleDrivePdfData: Array<GoogleApiData> = await listFolderContentsAsArrayOfData(folderId,drive, exportDestFolder,umbrellaFolder)
    const fileNameWithPath = createFileNameWithPathForExport(folderId, umbrellaFolder, exportDestFolder) + `_${FileUtils.ROW_COUNTER[1]}`;
    FileUtils.incrementRowCounter()
    //writeDataToCSV(googleDrivePdfData, `${fileNameWithPath}.csv`)
    // Convert data to XLSX
    if (!_.isEmpty(googleDrivePdfData)) {
        dataToXslx(googleDrivePdfData, `${fileNameWithPath}.xlsx`);
    }
    else {
        console.log("No Data retrieved. No File will be created");
    }
}
export async function listFolderContents(folderId: string, drive: drive_v3.Drive, umbrellaFolder:
    string, googleDrivePdfData: GoogleApiData[], idFolderNameMap: Map<string, string>, rootFolderName: string) {

    if (!idFolderNameMap.has(folderId)) {
        const folderPath = await getFolderPathRelativeToRootFolder(folderId, drive)
        var index = folderPath.indexOf(rootFolderName);
        const _trimmed = folderPath.slice(index);
        idFolderNameMap.set(folderId, _trimmed)
    }

    try {
        let files: drive_v3.Schema$File[] = [];
        let pageToken: string | undefined = undefined;
        do {
            const response: GaxiosResponse = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false and (mimeType='${PDF_MIME_TYPE}' or mimeType='${FOLDER_MIME_TYPE}')`,
                fields: 'nextPageToken, files(id, name, mimeType,size,parents,webViewLink,thumbnailLink,createdTime)',
                pageSize: 1000, // Increase the page size to retrieve more files if necessary
                pageToken: pageToken,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });
            files = files.concat(response.data.files || []);
            pageToken = response.data.nextPageToken;
        } while (pageToken);


        console.log(`Reading folder (${idFolderNameMap?.get(folderId)} containing items:(PDF+FOLDER Count): ${files?.length}`)
        if (files && files.length) {
            for (const file of files) {
                try {
                    addFileMetadataToArray(file, folderId, googleDrivePdfData, idFolderNameMap);
                    if (file.mimeType === FOLDER_MIME_TYPE) {
                        await listFolderContents(file?.id || '', drive, umbrellaFolder, googleDrivePdfData, idFolderNameMap, rootFolderName); // Recursively call the function for subfolders
                    }
                }
                catch (err) {
                    console.log(`Error reading file. ${file?.name}`, err);
                }
            }
        } else {
            console.log('No files found in the folder.');
        }
    } catch (err) {
        console.error('Error retrieving folder contents:', err);
    }
}

export const addFileMetadataToArray = (file: drive_v3.Schema$File, folderId: string,
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
            index: ++FileUtils.ROW_COUNTER[1],
            fileName: fileName,
            googleDriveLink: webViewLink,
            sizeInfo: sizeInfo(fileSize),
            fileSizeRaw: fileSizeRaw,
            parents: _parents,
            createdTime: createdTime,
            thumbnailLink: thumbnailLink,
        });

        console.log(`${FileUtils.ROW_COUNTER[0]}/${FileUtils.ROW_COUNTER[1]}). ${ellipsis(fileName, 40)} `);
    }
}