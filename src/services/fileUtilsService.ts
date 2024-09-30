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
        console.log(`fileStats: ${fileStats?.length}  ${JSON.stringify(fileStats.length > 0 ? fileStats[0] : { x: 0 })} `);

        for (let excelRow of excelData) {
            let newFileName = excelRow["Composite Title"]?.trim()
            const origName = excelRow["Orig Name"]?.trim()
            if (newFileName?.length > 0) {
                newFileName = newFileName.split(/\s+/).join(' ') + '.pdf'

                console.log(`\norigName: ${JSON.stringify(origName)} newFileName: ${JSON.stringify(newFileName)} `);
                const _fileInFolder = fileStats.find((fileStat) => {
                    if (fileStat.fileName === origName) {
                        console.log(`fileStat: ${JSON.stringify(fileStat)} `);
                    }
                    return fileStat.fileName === origName
                });
                console.log(`_fileInFolder: ${JSON.stringify(_fileInFolder)} `);
                if (_fileInFolder && _fileInFolder?.absPath?.length > 0) {
                    const absPath = _fileInFolder?.absPath
                    if (fs.existsSync(absPath)) {
                        try {
                            const parentDir = path.dirname(absPath);
                            const newPath = path.join(parentDir, newFileName);
                            fs.renameSync(absPath, newPath);
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
    }
    catch (err: any) {
        console.log('Error', err);
        return err;
    }
    console.log(`renameFilesViaExcel ${JSON.stringify(renameReport)} `)

    return renameReport;

}