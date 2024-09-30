import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { getAllPDFFiles } from "../utils/FileStatsUtils";
import { isValidPath } from "../utils/utils";

/**
 * 
 * @param excelPath https://docs.google.com/spreadsheets/d/1vjZVryQDluL6JUUIG5h0dAt4IlH9hfHZ/edit?gid=1858041903#gid=1858041903
 * @returns 
 */
export const renameFilesViaExcel = async (excelPath: string, folderOrProfile: string) => {
    try {
        const excelData = excelToJson(excelPath)
        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
        const fileStats = await getAllPDFFiles(folder);
        console.log(`excelData: ${JSON.stringify(excelData)} `);
        const results = []
        for (let i = 0; i < excelData.length; i++) {
            const newFileName = excelData["Composite Title"]
            const origName = excelData["Orig Name"]
            if (newFileName.length > 0) {
                console.log(`origName: ${JSON.stringify(origName)} newFileName: ${JSON.stringify(newFileName)} `);
                const _fileInFolder = fileStats.find((fileStat) => {
                    if (fileStat.fileName === origName) {
                        console.log(`fileStat: ${JSON.stringify(fileStat)} `);
                    }
                });
                console.log(`_fileInFolder: ${JSON.stringify(_fileInFolder)} `);
                results.push(_fileInFolder.absPath)
            }
        }
        return results;
    }
    catch (err: any) {
        console.log('Error', err);
        return err;
    }
}