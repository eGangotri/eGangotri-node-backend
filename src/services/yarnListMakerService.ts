import { combineGDriveAndReducedPdfExcels } from "../cliBased/googleapi/_utils/CombineMainAndReducedExcelData"
import { getLatestExcelFile } from "../utils/utils"

export const pickLatestExcelsAndCombineGDriveAndReducedPdfExcels = (mainFilePathAbs: string,
    secondaryFilePathAbs: string, destExcelPath: string) => {
    let mainExcelPath = ""
    let secondaryExcelPath = ""
    if (!mainFilePathAbs.endsWith(".xlsx")) {
        mainExcelPath = getLatestExcelFile(mainFilePathAbs)?.latestFilePath
    }
    else {
        mainExcelPath = mainFilePathAbs
    }
    if (!secondaryFilePathAbs.endsWith(".xlsx")) {
        secondaryExcelPath = getLatestExcelFile(secondaryFilePathAbs)?.latestFilePath
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
