import { isValidPath } from "utils/FileUtils";
import { combineGDriveAndReducedPdfExcels } from "../cliBased/googleapi/_utils/CombineMainAndReducedExcelData"
import { getLatestExcelFile } from "../utils/utils"
import path from 'path';

export const pickLatestExcelsAndCombineGDriveAndReducedPdfExcels = async (mainFilePathAbs: string,
    secondaryFilePathAbs: string, destExcelPath: string) => {
    let mainExcelPath = ""
    let secondaryExcelPath = ""
    if (!mainFilePathAbs.endsWith(".xlsx")) {
        const latest = await getLatestExcelFile(mainFilePathAbs)
        mainExcelPath = latest?.latestFilePath
    }
    else {
        mainExcelPath = mainFilePathAbs
    }
    if (!secondaryFilePathAbs.endsWith(".xlsx")) {
        const latest2 = await getLatestExcelFile(secondaryFilePathAbs)
        secondaryExcelPath = latest2.latestFilePath
    }

    else {
        secondaryExcelPath = secondaryFilePathAbs
    }

    if (!mainExcelPath || !secondaryExcelPath) {
        console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
        return {
            success: false,
            errMsg: `one of mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath} missing`
        }
    }
    console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
    const _cmbned = await combineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath)
    return _cmbned;
}


export const genLinksAndFolders =
    (googleDriveLink: string, folderName: string) => {
        const _links = []
        const _folders = [];
        if (googleDriveLink.includes(",")) {
            const links = googleDriveLink.split(",").map((link: string) => {
                return link.trim()
            })
            _links.push(...links);

            for (let i = 0; i < links.length; i++) {
                _folders.push(`${folderName}-${i + 1}`);
            }
        }

        else {
            _links.push(googleDriveLink.trim());
            _folders.push(folderName.trim());
        }

        // Check if _links contains exclusively non-empty items
        const hasEmptyLinks = _links.some(link => !link || link.trim() === '');
        
        // Check if all folders are valid
        const hasInvalidFolders = _folders.some(folder => !folder || folder.trim() === '');
        
        // Check if links are valid Google Drive links
        const isValidGDriveLink = (link: string): boolean => {
            return link && link.trim() !== '' && 
                (link.includes('drive.google.com') || 
                 link.includes('docs.google.com') || 
                 link.startsWith('https://'));
        };
        
        const hasInvalidLinks = _links.some(link => !isValidGDriveLink(link));
        
        return {
            error: _links.length != _folders.length || hasEmptyLinks || hasInvalidFolders || hasInvalidLinks,
            message: hasEmptyLinks 
                ? "Links cannot be empty" 
                : hasInvalidLinks 
                ? "Invalid Google Drive links detected" 
                : hasInvalidFolders 
                ? "Invalid folder names detected" 
                : _links.length != _folders.length 
                ? "Number of links and folders don't match" 
                : "",
            _links,
            _folders
        }
    }

export const validateGenGDriveLinks =
    (googleDriveLink: string, folderName: string) => {
        if (!googleDriveLink || !folderName) {
            return {
                "status": "failed",
                "success": false,
                "message": "Pls. provide google drive Link"
            }
        }

        if (folderName.includes(path.sep)) {
            return {
                "status": "failed",
                "success": false,
                "message": "Folder Name cannot have path separators"
            }
        }
        return {
            "success": true,
        }
    }