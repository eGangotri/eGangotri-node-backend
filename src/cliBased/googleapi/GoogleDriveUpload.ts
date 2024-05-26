import { drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { getGoogleDriveInstance } from './service/CreateGoogleDrive';
import * as mime from 'mime-types';
import { extractGoogleDriveId } from '../../mirror/GoogleDriveUtilsCommonCode';
import { PDF_MIME_TYPE } from './_utils/constants';
import { excelToJson } from '../../cliBased/excel/ExcelUtils';
import { FileStats } from '../../imgToPdf/utils/types';

export const uploadToGDriveBasedOnDiffExcel = async (diffExcelPath: string, gDriveRootFolder: string) => {
    const gDriveExcelAsJSON: FileStats[] = excelToJson(diffExcelPath)
    const drive: drive_v3.Drive = getGoogleDriveInstance();
    const _results = []
    for (let item of gDriveExcelAsJSON) {
        const folderToDumpTo = await findFolderByPath(gDriveRootFolder, item.folder, drive)
        if (!folderToDumpTo) {
            console.log(`Folder not found: ${item.folder}`);
            _results.push({
                success: false,
                msg: `Folder not found: ${item.folder}`,
                filePath: item.absPath
            })
        }
        else {
            const _res = await uploadFileToGDrive(item.absPath, folderToDumpTo, drive)
            _results.push(_res)
        }
    }
    return {
        diffExcelPath,
        gDriveRootFolder,
        itemsProcessed: _results.length,
        diffItemsCount: gDriveExcelAsJSON.length,
        _results,
    }
}

export const uploadFileToGDrive = async (filePath: string,
    driveLinkOrFolderIdOfParent: string,
    _drive: drive_v3.Drive = undefined) => {

    const drive: drive_v3.Drive = _drive || getGoogleDriveInstance();
    const folderId = extractGoogleDriveId(driveLinkOrFolderIdOfParent)
    console.log(`uploadFileToGDrive: ${filePath} in ${folderId}`);
    const mimeType = mime.lookup(filePath) || PDF_MIME_TYPE;

    const fileMetadata = {
        'name': path.basename(filePath),
        'parents': [folderId]
    };
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
    };

    let result = {};
    try {
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id'
        });

        console.log('File Id:', file.data.id);

        result = {
            success: true,
            filePath,
            fileId: file.data.id,
        };
    } catch (err) {
        console.error(err);

        result = {
            success: false,
            filePath,
            err
        };
    }
    console.log(`result: ${JSON.stringify(result)}`)
    return result;
}

async function findFolderByPath(driveLinkOrFolderID: string, _gDrivePath: string, _drive: drive_v3.Drive = undefined) {
    const gDrivePath = removeFolderRoot(_gDrivePath);

    console.log(`findFolderByPath: ${gDrivePath} in ${driveLinkOrFolderID}`)
    const drive: drive_v3.Drive = _drive || getGoogleDriveInstance();

    const folderId = extractGoogleDriveId(driveLinkOrFolderID)

    const folderNames = gDrivePath.split(path.sep);
    let currentFolderId = folderId;

    for (const folderName of folderNames) {
        try {
            currentFolderId = await findSubFolderId(drive, currentFolderId, folderName);

            if (!currentFolderId) {
                console.log(`Folder not found: ${folderName}`);
                //This will make sure that if you have 
                //folder1/folder2/folder3 and folder2 is not found
                //but the GDrive correspondence is folder2/folder3
                //it can ignore folder1 and continue with folder2
                currentFolderId = folderId;
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    console.log(`Found folder: ${currentFolderId}`);
    return currentFolderId;
}

async function findSubFolderId(drive: drive_v3.Drive, folderId: string, folderName: string): Promise<string | null> {
    const res = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
        fields: 'files(id, name)',
    });

    const files = res.data.files;
    if (files.length === 0) {
        return null;
    }

    return files[0].id;
}

export const removeFolderRoot = (filePath: string) => {
    const driveLetter = path.parse(filePath).root;
    const relativePath = path.relative(driveLetter, filePath);

    // 'NMM-1\\August-2019\\01-08-2019\\M-9-Yajnavalkya Shiksha_Anuvak_Vajasaneyi Samhita - Kavikulguru Kalidas Sanskrit University Ramtek Collection'
    console.log(relativePath);
    return relativePath;
}

findFolderByPath("https://drive.google.com/drive/folders/1E5cb-iYNuO9ZHBq630GoWOTMGGEOhYH_?usp=drive_link",
    "g:\\bb\August-2019\\01-08-2019\\M-9-Yajnavalkya Shiksha_Anuvak_Vajasaneyi Samhita - Kavikulguru Kalidas Sanskrit University Ramtek Collection"
)