import { drive_v3 } from 'googleapis';
import fs from 'fs';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../../utils/utils';
import { sizeInfo } from '../../mirror/FrontEndBackendCommonCode';
import { dataToXslx } from './ExcelUtils';
import { EXPORT_DEST_FOLDER } from '../GoogleDriveApiReadAndExport';
import { CSV_SEPARATOR, FILE_MIME_TYPE, PDF_MIME_TYPE, SEPARATOR_SPECIFICATION } from './constants';
import * as path from "path";
import { GoogleApiData } from './types';


let ROW_COUNTER = 0;
let ROOT_FOLDER_NAME = ""

export async function listFolderContentsAndGenerateCSVAndExcel(_folderId: string, drive: drive_v3.Drive, umbrellaFolder: string = "") {
    const folderId = extractFolderId(_folderId)
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : await getFolderName(folderId, drive) || "";
    ROOT_FOLDER_NAME = await getFolderName(folderId, drive) || "";
    console.log(`drive api folder extracTion process initiated: \
    from (${_umbrellaFolder}) ${_folderId} destined to ${EXPORT_DEST_FOLDER}\n`)

    const googleDrivePdfData: Array<GoogleApiData> = []
    await listFolderContents(folderId, drive, umbrellaFolder, googleDrivePdfData);

    const fileNameWithPath = createFileNameWithPathForExport(folderId, umbrellaFolder) + `_${ROW_COUNTER}`;

    //writeDataToCSV(googleDrivePdfData, `${fileNameWithPath}.csv`)
    // Convert data to XLSX
    dataToXslx(googleDrivePdfData, `${fileNameWithPath}.xlsx`);
}

export async function listFolderContents(folderId: string, drive: drive_v3.Drive, umbrellaFolder: string, googleDrivePdfData: GoogleApiData[]) {
    let idFolderNameMap = new Map<string, string>();

    if (!idFolderNameMap.has(folderId)) {
        const folderPath = await getFolderPathRelativeToRootFolder(folderId, drive)
        var index = folderPath.indexOf(ROOT_FOLDER_NAME);  // Gets the first index where a space occours
        idFolderNameMap.set(folderId, folderPath.slice(index))
    }

    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false and (mimeType='${PDF_MIME_TYPE}' or mimeType='${FILE_MIME_TYPE}')`,
            fields: 'files(id, name, mimeType,size,parents,webViewLink,thumbnailLink,createdTime)',
            pageSize: 1000, // Increase the page size to retrieve more files if necessary
        });
        let x = 0;
        const files = response.data.files;
        if (files && files.length) {
            for (const file of files) {

                const fileName = file.name || "";
                const fileId = file.id || "";
                if (file.mimeType === FILE_MIME_TYPE) {
                    idFolderNameMap.set(fileId, fileName)
                }
                const filemimeType = file.mimeType || "";
                const fileSizeRaw = file.size || "0";
                const fileSize = parseInt(fileSizeRaw);
                const webViewLink = file.webViewLink || "/"
                const thumbnailLink = file.thumbnailLink || "/"
                const createdTime = file.createdTime || "/"
                const parents = idFolderNameMap.get(folderId) || "/"

                console.log(`\t${ROW_COUNTER + 1}, ${fileName},${fileSize},,"${parents}",${webViewLink},${thumbnailLink},${createdTime}
                 ${googleDriveLinkFromId(fileId)} `);

                if (filemimeType === PDF_MIME_TYPE) {
                    googleDrivePdfData.push({
                        index: ++ROW_COUNTER,
                        fileName: fileName,
                        googleDriveLink: webViewLink,
                        sizeInfo: sizeInfo(fileSize),
                        fileSizeRaw: fileSizeRaw,
                        parents: parents,
                        createdTime: createdTime,
                        thumbnailLink: thumbnailLink,
                    });
                }

                if (file.mimeType === FILE_MIME_TYPE) {
                    await listFolderContents(file?.id || '', drive, umbrellaFolder, googleDrivePdfData); // Recursively call the function for subfolders
                }
            }
        } else {
            console.log('No files found in the folder.');
        }
    } catch (err) {
        console.error('Error retrieving folder contents:', err);
    }
}

function createFileNameWithPathForExport(folderId: string, _umbrellaFolder: string) {
    const _csvDumpFolder = `${EXPORT_DEST_FOLDER}\\${_umbrellaFolder}`;
    if (!fs.existsSync(_csvDumpFolder)) {
        fs.mkdirSync(_csvDumpFolder);
    }
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const fileNameWithPath = `${_csvDumpFolder}\\${_umbrellaFolder}-${folderId}-${timeComponent}`;
    return fileNameWithPath;
}

function writeDataToCSV(data: any[], fileNameWithPath: string): void {
    // Convert the data array to a CSV-formatted string
    const csvContent = SEPARATOR_SPECIFICATION + data.map(row => row.join(CSV_SEPARATOR)).join('\n');

    // Write the CSV content to the file
    fs.writeFileSync(fileNameWithPath, csvContent, 'utf-8');
    console.log(`CSV File written to ${fileNameWithPath}`)
}

const googleDriveLinkFromId = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`
}

const getFolderName = async (folderId: string, drive: drive_v3.Drive) => {
    const res = await drive.files
        .get({ fileId: folderId })
        .catch((err) => console.log(err.errors));
    if (!res) return "";
    const folderName = res.data.name;
    return folderName;
}



const regex = new RegExp(`(?<=folders\/)[^? \n\r\t]*`);

function extractFolderId(folderIdOrUrl: string) {
    if (folderIdOrUrl.startsWith("http")) {
        const match = regex.exec(folderIdOrUrl);
        if (match) {
            return match[0];
        } else {
            return "";
        }
    }
    return folderIdOrUrl
}

async function getFolderPathRelativeToRootFolder(folderId: string, drive: drive_v3.Drive): Promise<string> {
    try {
        const response = await drive.files.get({
            fileId: folderId,
            fields: "name, parents",
        });

        const folder = response.data;
        const folderName = folder.name || "";
        const folderPath = ""
        if (folder.parents && folder.parents.length > 0) {
            // If the folder has a parent, recursively get its path
            const parentPath = await getFolderPathRelativeToRootFolder(folder.parents[0], drive);
            return path.join(parentPath, folderName);
        } else {
            // If the folder is the root folder, return its name
            return folderName;
        }

        //ROOT_FOLDER_NAME
    } catch (error) {
        throw new Error("Error getting folder path: " + error);
    }
}