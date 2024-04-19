import { combineGDriveAndReducedPdfExcels } from "../cliBased/googleapi/_utils/CombineMainAndReducedExcelData"
import { getLatestExcelFile } from "../utils/utils"

export const pickLatestExcelsAndCombineGDriveAndReducedPdfExcels = (mainFilePathAbs: string,
    secondaryFilePathAbs: string, destExcelPath: string) => {
    const mainExcelPath = getLatestExcelFile(mainFilePathAbs)
    const secondaryExcelPath = getLatestExcelFile(secondaryFilePathAbs);
    console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
    return combineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath)
}
