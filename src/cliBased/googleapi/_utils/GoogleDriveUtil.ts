import { drive_v3 } from 'googleapis';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../../../utils/utils';
import * as path from "path";
import { createFolderIfNotExistsAsync } from '../../../utils/FileUtils';

export async function createFileNameWithPathForExport(folderId: string,
    _umbrellaFolder: string,
    exportDestFolder: string,
    itemCount: number) {
    const _csvDumpFolder = `${exportDestFolder}\\${_umbrellaFolder}`;
    await createFolderIfNotExistsAsync(_csvDumpFolder);
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT) + "_HOURS"
    const fileNameWithPath = `${_csvDumpFolder}\\${_umbrellaFolder}-${itemCount}Items-${timeComponent}-${folderId}`;
    return fileNameWithPath;
}

export const getDriveFileDetails = async (folderId: string, drive: drive_v3.Drive) => {
    const res = await drive.files
        .get({ fileId: folderId })
        .catch((err) => console.log(err.errors));
    if (!res) return undefined;
    return res;
}

export const getFolderName = async (folderId: string, drive: drive_v3.Drive) => {
    const res = await getDriveFileDetails(folderId, drive)
        .catch((err) => console.log(err.errors));
    if (!res) return "";
    const folderName = res.data.name;
    return folderName;
}
export const getWebContentLinkAndFileName = async (folderId: string, drive: drive_v3.Drive) => {
    const res = await getDriveFileDetails(folderId, drive)
        .catch((err) => console.log(err.errors));
    if (!res) return ["", ""];
    return [res.data.name, res.data.webViewLink];
}

export const getWebContentLink = async (folderId: string, drive: drive_v3.Drive) => {
    const res = await getDriveFileDetails(folderId, drive)
        .catch((err) => console.log(err.errors));
    if (!res) return "";
    const webContentLink = res.data.webContentLink; //webViewLink
    return webContentLink;
}


/**
 * 
 * @param folderId if you see ) as your fildername then the parent is not beign fetched correctly.
 * just share the drive to the account that uses this api in my case
 * ega***fou***@gmail.com
 * then the parent will be calculated accurately.
 * @param drive 
 * @returns 
 */
export async function getFolderPathRelativeToRootFolder(folderId: string, drive: drive_v3.Drive): Promise<string> {
    console.log(`getFolderPathRelativeToRootFolder: ${folderId}`)
    try {
        const response = await drive.files.get({
            fileId: folderId,
            fields: "name, parents",
        });

        const folder = response.data;
        const folderName = folder.name || "";
        console.log(`getFolderPathRelativeToRootFolder:folderName: ${folderName}`)
        if (folder.parents && folder.parents.length > 0) {
            // If the folder has a parent, recursively get its path
            const parentPath = await getFolderPathRelativeToRootFolder(folder.parents[0], drive);
            return path.join(parentPath, folderName);
        } else {
            // If the folder is the root folder, return its name
            return folderName;
        }

    } catch (error) {
        throw new Error(`getFolderPathRelativeToRootFolder:Error getting folder path: 
            is ${folderId} has View Privileges by your gmail account?
            ${error}`);
    }
}