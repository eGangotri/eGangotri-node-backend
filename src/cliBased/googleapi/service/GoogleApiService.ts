import { drive_v3 } from 'googleapis';
import { dataToXslx } from '../../excel/ExcelUtils';
import { sizeInfo } from '../../../mirror/FrontEndBackendCommonCode';
import { FOLDER_MIME_TYPE, PDF_MIME_TYPE } from '../_utils/constants';
import { GoogleApiData } from '../types';
import { createFileNameWithPathForExport, getFolderName, getFolderPathRelativeToRootFolder } from '../_utils/GoogleDriveUtil';
import * as _ from 'lodash';
import { GaxiosResponse } from 'gaxios';
import { ellipsis } from '../../../mirror/utils';
import * as FileUtils from '../../../imgToPdf/utils/FileUtils';
import { extractGoogleDriveId } from '../../../mirror/GoogleDriveUtilsCommonCode';

export async function listFolderContentsAsArrayOfData(folderId: string,
    drive: drive_v3.Drive,
    umbrellaFolder: string = "",
    ignoreFolder = "",
    pdfOnly = true) {

    const rootFolderName = await getFolderName(folderId, drive) || "";
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : rootFolderName;

    console.log(`drive api folder extracTion process initiated: \
    from (${_umbrellaFolder}) ${folderId} \n`)

    const googleDriveFileData: Array<GoogleApiData> = []
    let idFolderNameMap = new Map<string, string>();

    await listFolderContents(folderId, drive, umbrellaFolder, googleDriveFileData, idFolderNameMap, rootFolderName, ignoreFolder, pdfOnly);
    return googleDriveFileData
}

export async function listFolderContentsAndGenerateCSVAndExcel(_folderIdOrUrl: string,
    drive: drive_v3.Drive,
    exportDestFolder: string,
    umbrellaFolder: string = "",
    ignoreFolder = "",
    pdfOnly = true) {
    const folderId = extractGoogleDriveId(_folderIdOrUrl)
    FileUtils.createFolderIfNotExists(exportDestFolder);

    const googleDriveFileData: Array<GoogleApiData> = await listFolderContentsAsArrayOfData(folderId,
        drive, umbrellaFolder, ignoreFolder, pdfOnly)
    const fileNameWithPath = createFileNameWithPathForExport(folderId, umbrellaFolder, exportDestFolder, FileUtils.ROW_COUNTER[1]) ;
    FileUtils.incrementRowCounter()
    //writeDataToCSV(googleDriveFileData, `${fileNameWithPath}.csv`)
    // Convert data to XLSX
    console.log(`googleDriveFileData ${googleDriveFileData.length} `);
    if (!_.isEmpty(googleDriveFileData)) {
        const excelName = `${fileNameWithPath}.xlsx`;
        await dataToXslx(googleDriveFileData, excelName);
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
    pdfOnly = true) {

    if (!idFolderNameMap.has(folderId)) {
        const folderPath = await getFolderPathRelativeToRootFolder(folderId, drive)
        var index = folderPath.indexOf(rootFolderName);
        const _trimmed = folderPath.slice(index);
        idFolderNameMap.set(folderId, _trimmed)
    }

    try {
        let files: drive_v3.Schema$File[] = [];
        let pageToken: string | undefined = undefined;
        //
        const conditionForIgnoreFolder = ignoreFolder?.length > 0 ? ` and not name contains '${ignoreFolder}'` : "";
        const conditionForPdfOnly = pdfOnly ? ` and (mimeType='${PDF_MIME_TYPE}' or mimeType='${FOLDER_MIME_TYPE}') ` : ` and (mimeType!='' or  mimeType='${FOLDER_MIME_TYPE}')` ;

        //
        const _query = `'${folderId}' in parents and trashed = false ${conditionForPdfOnly} ${conditionForIgnoreFolder} `
        console.log(`_query ${_query}`)
        do {
            const response: GaxiosResponse = await drive.files.list({
                q: _query,
                fields: 'nextPageToken, files(id, name, mimeType,size,parents,webViewLink,thumbnailLink,createdTime)',
                pageSize: 1000, // Increase the page size to retrieve more files if necessary
                pageToken: pageToken,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });
            files = files.concat(response.data.files || []);
            pageToken = response.data.nextPageToken;
        } while (pageToken);


        console.log(`Reading folder (${idFolderNameMap?.get(folderId)} containing items:(FILES+FOLDER Count): ${files?.length}`)
        if (files && files.length) {
            for (const file of files) {
                try {
                    addFileMetadataToArray(file, folderId, googleDriveFileData, idFolderNameMap);
                    if (file.mimeType === FOLDER_MIME_TYPE) {
                        await listFolderContents(file?.id || '', drive,
                            umbrellaFolder,
                            googleDriveFileData,
                            idFolderNameMap,
                            rootFolderName,
                            ignoreFolder,
                            pdfOnly); // Recursively call the function for subfolders
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
    googleDriveFileData: GoogleApiData[],
    idFolderNameMap: Map<string, string>) => {

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