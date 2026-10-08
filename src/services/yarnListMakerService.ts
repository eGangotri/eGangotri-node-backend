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


export const genLinksForGDriveListing =
    (googleDriveLinks: string) => {
        const _links = []
        if (googleDriveLinks.includes(",")) {
            const links = googleDriveLinks.split(",").map((link: string) => {
                if (!link.trim().startsWith("http")) {
                    return `https://drive.google.com/drive/u/0/folders/${link.trim()}`;
                }
                else {
                    return link.trim()
                }
            })
            _links.push(...links);
        }

        else {
            _links.push(googleDriveLinks.startsWith("http") ? googleDriveLinks.trim() : `https://drive.google.com/drive/u/0/folders/${googleDriveLinks.trim()}`);
        }

        // Check if _links contains exclusively non-empty items
        const hasEmptyLinks = _links.some(link => !link || link.trim() === '');

        // Check if links are valid Google Drive links
        const isValidGDriveLink = (link: string): boolean => {
            return link && link.trim() !== '' &&
                (link.includes('drive.google.com') ||
                    link.includes('docs.google.com') ||
                    link.startsWith('https://'));
        };

        const hasInvalidLinks = _links.some(link => !isValidGDriveLink(link));

        return {
            error: hasEmptyLinks || hasInvalidLinks,
            message: hasEmptyLinks
                ? "Links cannot be empty"
                : (hasInvalidLinks
                    ? "Invalid Google Drive links detected":"All OK"),
            _links,
        }
    }

export const validateGenGDriveLinks =
    (googleDriveLink: string) => {
        if (!googleDriveLink) {
            return {
                "status": "failed",
                "success": false,
                "message": "Pls. provide google drive Link"
            }
        }
        return {
            "success": true,
        }
    }