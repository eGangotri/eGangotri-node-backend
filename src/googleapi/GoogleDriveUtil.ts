import { drive_v3 } from 'googleapis';
import fs from 'fs';
import * as os from 'os';
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from '../utils/utils';
import { readPdfFromDriveAndMerge } from './GoogleDrivePdfReader';
import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';
import { convertCsvToXlsx } from './XlsxUtils';
import { fi } from 'date-fns/locale';

const HOME_DIR = os.homedir();
export const CSV_SEPARATOR = ";"
export const SEPARATOR_SPECIFICATION = `sep=${CSV_SEPARATOR}\n`

const csvData: Array<Array<string>> = []


export async function listFolderContentsSingle(folderId: string, drive: drive_v3.Drive) {
    try {
        // Retrieve the files from the folder
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(name, id, mimeType)',
        });

        // Display the files' information
        const files = res.data.files;
        if (files && files.length) {
            console.log('Files:');
            files.forEach((file: any) => {
                console.log(`${file.name} (${file.id}) - ${file.mimeType}\n
          https://drive.google.com/file/d/${file.id}/view?usp=drive_link`);
            });
        } else {
            console.log('No files found.');
        }
    } catch (err) {
        console.error('Error retrieving folder contents:', err);
    }
}

export async function listFolderContentsAndGenerateCSV(folderId: string, drive: drive_v3.Drive, umbrellaFolder: string = "") {
    const _umbrellaFolder = umbrellaFolder?.length > 0 ? umbrellaFolder : await getFolderName(folderId, drive) || "";
    await listFolderContents(folderId, drive,umbrellaFolder);
    const fileNameWithPath = createFileNameWithPathForExport(folderId,umbrellaFolder);
    writeDataToCSV(csvData, `${fileNameWithPath}.csv`)
    // Convert CSV to XLSX
    convertCsvToXlsx(csvData,`${fileNameWithPath}.xlsx`);
}

export async function listFolderContents(folderId: string, drive: drive_v3.Drive,umbrellaFolder: string) {
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

                console.log(`${fileName}, ${googleDriveLinkFromId(fileId)} , ${filemimeType},${fileSize},${fileSizeRaw},${parents} `);
                if (filemimeType === 'application/pdf') {
                    csvData.push([fileName, googleDriveLinkFromId(fileId), filemimeType, sizeInfo(fileSize),fileSizeRaw, parents])

                   if(x++ <2){
                   // await readPdfFromDriveAndMerge(drive,parents,'1zaAbe-16sfksUxpFO-Ql9TI5ayLMnp00',umbrellaFolder);
                   }
                }

                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    await listFolderContents(file?.id || '', drive,umbrellaFolder); // Recursively call the function for subfolders
                }
            }
        } else {
            console.log('No files found in the folder.');
        }
    } catch (err) {
        console.error('Error retrieving folder contents:', err);
    }
}

function createFileNameWithPathForExport(folderId:string, _umbrellaFolder: string) {
    const _csvDumpFolder = `${HOME_DIR}\\${_umbrellaFolder}`; 
    if (!fs.existsSync(_csvDumpFolder)){
        fs.mkdirSync(_csvDumpFolder);
    }
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_FORMAT)
    const fileNameWithPath = `${_csvDumpFolder}\\csv-ggl-drv-${folderId}-${_umbrellaFolder}-${timeComponent}`;
    return fileNameWithPath;
}
function writeDataToCSV(data: any[], fileNameWithPath: string): void {
    // Convert the data array to a CSV-formatted string
    console.log(`${data[0]} ${data.length}`);

    const csvContent = SEPARATOR_SPECIFICATION + data.map(row => row.join(CSV_SEPARATOR)).join('\n');

    // Write the CSV content to the file
    fs.writeFileSync(fileNameWithPath, csvContent, 'utf-8');
    console.log(`file written to ${fileNameWithPath}`)
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