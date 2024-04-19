import { combineGDriveAndReducedPdfExcels } from "../cliBased/googleapi/_utils/CombineMainAndReducedExcelData"
import { getLatestExcelFile } from "../utils/utils"

export const pickLatestExcelsAndCombineGDriveAndReducedPdfExcels = (mainFilePathAbs: string,
    secondaryFilePathAbs: string, destExcelPath: string) => {
    const { latestFilePath: mainExcelPath } = getLatestExcelFile(mainFilePathAbs)
    const { latestFilePath: secondaryExcelPath } = getLatestExcelFile(secondaryFilePathAbs)

    console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
    return combineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath)
}
