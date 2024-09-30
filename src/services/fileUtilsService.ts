import { error } from "console";
import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { getAllPDFFiles } from "../utils/FileStatsUtils";
import { isValidPath } from "../utils/utils";
import * as fs from "fs";
import * as path from 'path';

/**
 * 
 * @param excelPath https://docs.google.com/spreadsheets/d/1vjZVryQDluL6JUUIG5h0dAt4IlH9hfHZ/edit?gid=1858041903#gid=1858041903
 * @returns 
 */
export const renameFilesViaExcel = async (excelPath: string, folderOrProfile: string) => {
    const renameReport = {
        errorList: [],
        success: [],
        totalCount: 0
    }

    try {
        const excelData = excelToJson(excelPath)
        const folder = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
        const fileStats = await getAllPDFFiles(folder);
        console.log(`excelData: ${excelData?.length} `);
        renameReport.totalCount = excelData?.length || 0

        for (let i = 0; i < excelData?.length; i++) {
            console.log(`excelData(${i}): ${excelData[i]?.length} `);

            const newFileName = excelData["Composite Title"]
            const origName = excelData["Orig Name"]
            if (newFileName?.length > 0) {
                console.log(`\norigName: ${JSON.stringify(origName)} newFileName: ${JSON.stringify(newFileName)} `);
                const _fileInFolder = fileStats.find((fileStat) => {
                    if (fileStat.fileName === origName) {
                        console.log(`fileStat: ${JSON.stringify(fileStat)} `);
                    }
                });
                console.log(`_fileInFolder: ${JSON.stringify(_fileInFolder)} `);
                const absPath = _fileInFolder.absPath
                if (fs.existsSync(absPath)) {
                    try {
                        const parentDir = path.dirname(absPath);
                        const newPath = path.join(parentDir, newFileName);
                      //  fs.renameSync(absPath, newPath);
                        console.log(`File renamed to ${newFileName}`)
                        renameReport.success.push(`File ${absPath} renamed to ${newFileName}`)
                    }
                    catch (e) {
                        console.log(`Error renaming file ${absPath} to ${newFileName} ${e}`)
                        renameReport.errorList.push(`Error renaming file ${absPath} to ${newFileName} ${e}`)
                    }
                }
            }
        }
    }
    catch (err: any) {
        console.log('Error', err);
        return err;
    }
    console.log(`renameFilesViaExcel ${JSON.stringify(renameReport)} `)

    return renameReport;

}