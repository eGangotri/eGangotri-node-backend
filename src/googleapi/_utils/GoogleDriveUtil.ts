import { drive_v3 } from 'googleapis';
import fs from 'fs';
import * as os from 'os';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../../utils/utils';
import { sizeInfo } from '../../mirror/FrontEndBackendCommonCode';
import { dataToXslx } from './ExcelUtils';
import { EXPORT_DEST_FOLDER } from '../GoogleDriveApiReadAndExport';

const HOME_DIR = os.homedir();
export const CSV_SEPARATOR = ";"
export const SEPARATOR_SPECIFICATION = `sep=${CSV_SEPARATOR}\n`


const googleDrivePdfData: Array<Array<string | number>> = []
let ROW_COUNTER = 0;

export async function listFolderContentsAndGenerateCSVAndExcel(_folderId: string, drive: drive_v3.Drive, umbrellaFolder: string = "") {
    const folderId = extractFolderId(_folderId)
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : await getFolderName(folderId, drive) || "";

    console.log(`drive api folder extracTion process initiated: \
    from (${_umbrellaFolder}) ${_folderId} destined to ${EXPORT_DEST_FOLDER}\n`)

    await listFolderContents(folderId, drive, umbrellaFolder);

    const fileNameWithPath = createFileNameWithPathForExport(folderId, umbrellaFolder) + `_${ROW_COUNTER-1}`;
    //writeDataToCSV(googleDrivePdfData, `${fileNameWithPath}.csv`)
    // Convert CSV to XLSX
    dataToXslx(googleDrivePdfData, `${fileNameWithPath}.xlsx`);
}

export async function listFolderContents(folderId: string, drive: drive_v3.Drive, umbrellaFolder: string) {
    const folderName = await getFolderName(folderId, drive) || "";
    let idFolderNameMap = new Map<string, string>();

    if (!idFolderNameMap.has(folderId)) {
        idFolderNameMap.set(folderId, folderName)
    }

    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType,size,parents)',
            pageSize: 1000, // Increase the page size to retrieve more files if necessary
        });
        let x = 0;

        const files = response.data.files;
        if (files && files.length) {
            for (const file of files) {

                const fileName = file.name || "";
                const fileId = file.id || "";
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    idFolderNameMap.set(fileId, fileName)
                }
                const filemimeType = file.mimeType || "";
                const fileSizeRaw = file.size || "0";
                const fileSize = parseInt(fileSizeRaw);
                const parents = file.parents?.map(x => idFolderNameMap.get(x) || x).join("/") || "/"
                console.log(`\t${ROW_COUNTER}, ${fileName}, ${googleDriveLinkFromId(fileId)},${fileSize},${fileSizeRaw},${parents} `);
                if (filemimeType === 'application/pdf') {
                    googleDrivePdfData.push([++ROW_COUNTER, fileName, googleDriveLinkFromId(fileId), sizeInfo(fileSize), fileSizeRaw, parents])
                }

                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    await listFolderContents(file?.id || '', drive, umbrellaFolder); // Recursively call the function for subfolders
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
    if(folderIdOrUrl.startsWith("http")){
        const match = regex.exec(folderIdOrUrl);
        if (match) {
          return match[0];
        } else {
          return "";
        }
    }
    return folderIdOrUrl
}

