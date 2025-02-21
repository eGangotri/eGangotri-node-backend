import { drive_v3 } from 'googleapis';
import { jsonDataToXslx, jsonDataToXslxFileRenamerV2 } from '../../excel/ExcelUtils';
import { sizeInfo } from '../../../mirror/FrontEndBackendCommonCode';
import { FOLDER_MIME_TYPE, PDF_TYPE } from '../_utils/constants';
import { GoogleApiData } from '../types';
import { createFileNameWithPathForExport, getFolderName, getFolderPathRelativeToRootFolder } from '../_utils/GoogleDriveUtil';
import * as _ from 'lodash';
import { ellipsis } from '../../../mirror/utils';
import * as FileUtils from '../../../utils/FileUtils';
import * as FileConstUtils from '../../../utils/constants';
import { extractGoogleDriveId } from '../../../mirror/GoogleDriveUtilsCommonCode';
import { constructGoogleApiQuery } from '../Utils';

export async function listFolderContentsAsArrayOfData(folderId: string,
    drive: drive_v3.Drive,
    umbrellaFolder: string = "",
    ignoreFolder = "",
    fileType = PDF_TYPE,
    rowCounterController = "") {

    const rootFolderName = await getFolderName(folderId, drive) || "";
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : rootFolderName;

    console.log(`drive api folder metadata extraction process initiated: \
    Umbrella Folder (${_umbrellaFolder}) 
    Folder Id ${folderId} 
    rootFolderName ${rootFolderName}.\n`)

    const googleDriveFileData: Array<GoogleApiData> = []
    let idFolderNameMap = new Map<string, string>();

    await listFolderContents(folderId, drive, umbrellaFolder, 
        googleDriveFileData, idFolderNameMap, rootFolderName,
         ignoreFolder, fileType,rowCounterController);
    return googleDriveFileData
}

export async function listFolderContentsAndGenerateCSVAndExcel(_folderIdOrUrl: string,
    drive: drive_v3.Drive,
    exportDestFolder: string,
    umbrellaFolder: string = "",
    ignoreFolder = "",
    type = PDF_TYPE, rowCounterController = "") {
    const gDriveFolderId = extractGoogleDriveId(_folderIdOrUrl)
    FileUtils.createFolderIfNotExists(exportDestFolder);

    const googleDriveFileData: Array<GoogleApiData> = await listFolderContentsAsArrayOfData(gDriveFolderId,
        drive, umbrellaFolder, ignoreFolder, type)
    const fileNameWithPath = await createFileNameWithPathForExport(gDriveFolderId,
         umbrellaFolder, exportDestFolder, FileConstUtils.getRowCounter(rowCounterController)[1]);
    FileConstUtils.incrementRowCounter(rowCounterController);

    // Convert data to XLSX
    console.log(`googleDriveFileData ${googleDriveFileData.length} `);
    if (!_.isEmpty(googleDriveFileData)) {
        const excelName = `${fileNameWithPath}.xlsx`;
        await jsonDataToXslx(googleDriveFileData, excelName);
        return {
            msg: `Excel file created at ${excelName}`,
            excelName
        };
    }
    else {
        console.log("No Data retrieved. No File will be created");
        return {
            success: false,
            msg: `No Data retrieved.`,
        }
    }
}

export async function listFolderContentsAndGenerateExcelV2ForPdfRenamer(_folderIdOrUrl: string,
    drive: drive_v3.Drive,
    exportDestFolder: string,
    umbrellaFolder: string = "",
    ignoreFolder = "",
    type = PDF_TYPE,
    rowCounterController = "") {
    const folderId = extractGoogleDriveId(_folderIdOrUrl)
    FileUtils.createFolderIfNotExists(exportDestFolder);

    const googleDriveFileData: Array<GoogleApiData> = await listFolderContentsAsArrayOfData(folderId,
        drive, umbrellaFolder, ignoreFolder, type)
    const fileNameWithPath = await createFileNameWithPathForExport(folderId, umbrellaFolder, exportDestFolder,
        FileConstUtils.getRowCounter(rowCounterController)[1]);
    FileConstUtils.incrementRowCounter(rowCounterController);
    // Convert data to XLSX
    console.log(`googleDriveFileData ${googleDriveFileData.length} `);
    if (!_.isEmpty(googleDriveFileData)) {
        const excelName = `${fileNameWithPath}.xlsx`;
        await jsonDataToXslxFileRenamerV2(googleDriveFileData, excelName);
        return {
            msg: `Excel file created at ${excelName}`,
            excelName
        };
    }
    else {
        console.log("No Data retrieved. No File will be created");
        return {
            success: false,
            msg: `No Data retrieved.`,
        }
    }
}

export async function listFolderContents(folderId: string,
    drive: drive_v3.Drive,
    umbrellaFolder: string,
    googleDriveFileData: GoogleApiData[],
    idFolderNameMap: Map<string, string>,
    rootFolderName: string,
    ignoreFolder = "",
    fileType = PDF_TYPE,
    rowCounterController = "") {

    if (!idFolderNameMap.has(folderId)) {
        const folderPath = await getFolderPathRelativeToRootFolder(folderId, drive)
        var index = folderPath.indexOf(rootFolderName);
        const _trimmed = folderPath.slice(index);
        idFolderNameMap.set(folderId, _trimmed)
    }

    try {
        let files: drive_v3.Schema$File[] = [];
        let pageToken: string | undefined = undefined;

        const _query = constructGoogleApiQuery(folderId, ignoreFolder, fileType);
        let idx = 0
        console.log(`_query(${++idx}) ${_query}`)
        do {
            //: GaxiosResponse<drive_v3.Schema$FileList> 
            const response = await drive.files.list({
                q: _query,
                fields: 'nextPageToken, files(id, name, mimeType,size,parents,webViewLink,thumbnailLink,createdTime)',
                pageSize: 1000, // Increase the page size to retrieve more files if necessary
                pageToken: pageToken,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });
            console.log(`resp: ${idx} ${JSON.stringify(response?.data?.files || "no files")}`)
            files = files.concat(response.data.files || []);
            pageToken = response.data.nextPageToken;
            console.log(`after nextPageToken: ${idx}`)
        } while (pageToken);


        console.log(`Reading folder (${idFolderNameMap?.get(folderId)} containing items:(FILES+FOLDER Count): ${files?.length}`)
        if (files && files.length) {
            for (const file of files) {
                try {
                    addFileMetadataToArray(file, folderId, googleDriveFileData, idFolderNameMap, rowCounterController);
                    if (file.mimeType === FOLDER_MIME_TYPE) {
                        await listFolderContents(file?.id || '', drive,
                            umbrellaFolder,
                            googleDriveFileData,
                            idFolderNameMap,
                            rootFolderName,
                            ignoreFolder,
                            fileType,
                            rowCounterController); // Recursively call the function for subfolders
                    }
                }
                catch (err) {
                    console.log(`Error reading file. ${file?.name}`, err);
                }
            }
        } else {
            console.log('No files found in the folder.');
        }
    } catch (error) {
        console.error('Error retrieving folder contents:', error);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error, null, 2));
        }
    }
}

export const addFileMetadataToArray = (file: drive_v3.Schema$File,
    folderId: string,
    googleDriveFileData: GoogleApiData[],
    idFolderNameMap: Map<string, string>,
    rowCounterController = "") => {

    const fileName = file.name || "";
    const filemimeType = file.mimeType || "";
    const fileSizeRaw = file.size || "0";
    const fileSize = parseInt(fileSizeRaw);
    const webViewLink = file.webViewLink || "/"
    const thumbnailLink = file.thumbnailLink || "/"
    const createdTime = file.createdTime || "/"
    const _parents = idFolderNameMap.get(folderId) || "/"

    if (filemimeType !== FOLDER_MIME_TYPE) {
        googleDriveFileData.push({
            index: FileConstUtils.incrementColumnCounter(rowCounterController),
            fileName: fileName,
            googleDriveLink: webViewLink,
            sizeInfo: sizeInfo(fileSize),
            fileSizeRaw: fileSizeRaw,
            parents: _parents,
            createdTime: createdTime,
            thumbnailLink: thumbnailLink,
        });

        console.log(`${FileConstUtils.getRowCounter(rowCounterController)[0]}/${FileConstUtils.getRowCounter(rowCounterController)[1]}). ${ellipsis(fileName, 40)} `);
    }
}