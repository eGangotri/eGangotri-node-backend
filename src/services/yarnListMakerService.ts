import { combineGDriveAndReducedPdfExcels } from "../cliBased/googleapi/_utils/CombineMainAndReducedExcelData"
import { getLatestExcelFile } from "../utils/utils"

export const pickLatestExcelsAndCombineGDriveAndReducedPdfExcels = (mainFilePathAbs: string,
    secondaryFilePathAbs: string, destExcelPath: string) => {
    const { latestFilePath: mainExcelPath } = getLatestExcelFile(mainFilePathAbs)
    const { latestFilePath: secondaryExcelPath } = getLatestExcelFile(secondaryFilePathAbs)

    if(!mainExcelPath || !secondaryExcelPath){
        console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
        return {
            success:false,
            errMsg: `one of mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath} missing`
        }
    }
    console.log(`pickLatestExcelsAndCombineGDriveAndReducedPdfExcels mainExcelPath ${mainExcelPath} secondaryExcelPath ${secondaryExcelPath}`)
    return combineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath)
}
