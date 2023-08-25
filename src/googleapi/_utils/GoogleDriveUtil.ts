import { drive_v3 } from 'googleapis';
import fs from 'fs';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../../utils/utils';
import * as path from "path";

export function createFileNameWithPathForExport(folderId: string, _umbrellaFolder: string, exportDestFolder: string) {
    const _csvDumpFolder = `${exportDestFolder}\\${_umbrellaFolder}`;
    if (!fs.existsSync(_csvDumpFolder)) {
        fs.mkdirSync(_csvDumpFolder);
    }
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const fileNameWithPath = `${_csvDumpFolder}\\${_umbrellaFolder}-${folderId}-${timeComponent}`;
    return fileNameWithPath;
}

export const googleDriveLinkFromId = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`
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

//Sample:  https://drive.google.com/file/d/11ovaMqoQxVe06gzjPmLkFlbk2-ghHSrr/view?usp=drivesdk
const regex1 = /\/d\/([^/]+)\/view/;

//Sample: https://drive.google.com/drive/folders/1eJnYKRgZIyPO2s-BgsJ4ozhCEuH3i_lQ?usp=drive_link
const regex2 = /\/folders\/([^?/]+)(?:\?|$)/;

export function extractGoogleDriveId(folderIdOrUrl: string) {

    if (folderIdOrUrl.startsWith("http")) {
        let match: RegExpMatchArray | null;
        if (folderIdOrUrl.includes("/d/")) {
            console.log("folderIdOrUrl contains /d" )
            match = folderIdOrUrl.match(regex1);
        }
        else {
            match = folderIdOrUrl.match(regex2);
        }
        console.log("match" + match)

        if (match) {
            console.log("m[0]" + match[0])
            console.log("m[1]" + match[1])
            return match[1];
        } else {
            return "";
        }
    }
    return folderIdOrUrl
}

export async function getFolderPathRelativeToRootFolder(folderId: string, drive: drive_v3.Drive): Promise<string> {
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

    } catch (error) {
        throw new Error("Error getting folder path: " + error);
    }
}