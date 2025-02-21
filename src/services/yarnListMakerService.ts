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
    return combineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath)
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

        return {
            error: _links.length != _folders.length,
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