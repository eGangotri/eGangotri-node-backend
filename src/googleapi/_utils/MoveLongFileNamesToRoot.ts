//some files are very long and they cant be uploaded to google drive
//so by moving them to the Root folder.
//they will be pushed to google drive. as google drive counts all folders char length + file name length

import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils";
import * as path from 'path';
import fs from 'fs';
import { move } from "fs-extra";

const MAX_FILE_NAME_PERMITTED = 170

const MOVED_FILE_LIST:string[] = []
const CANT_MOVE_FILE_LIST:string[] = []
let TOTAL_FILE_COUNT = 0;

function moveFile(sourcePath: string, destinationPath: string) {
    console.log(`moveFile \n${sourcePath} \n${destinationPath}`);
    try {
        fs.renameSync(sourcePath, destinationPath);
        console.log(`File ${destinationPath} moved successfully.`);
        MOVED_FILE_LIST.push(destinationPath)
      } catch (err) {
        console.error(`Error ${destinationPath} moving the file:`, err);
        CANT_MOVE_FILE_LIST.push(destinationPath)
      }
}

const _execute = (rootFolder: string) => {
    const allPdfs = getAllPDFFiles(rootFolder)
    TOTAL_FILE_COUNT = allPdfs.length
    console.log(`allPdfs length in ${rootFolder}: ${TOTAL_FILE_COUNT}`)
    const rootFolderBase = path.basename(rootFolder)
    for (const [index, pdf] of allPdfs.entries()) {
        const filePath = path.parse(pdf);
        const pdfName = filePath.name

        if (pdfName.length > MAX_FILE_NAME_PERMITTED) {
            const parent = path.basename(filePath.dir)
            if (parent === rootFolderBase) {
                console.log(`cant move ${pdfName} already in root folder`)
                CANT_MOVE_FILE_LIST.push(`${rootFolder}\\${pdfName}.pdf`)
            }
            else {
                moveFile(pdf, `${rootFolder}\\${pdfName}.pdf`)
            }
        }
    }
}
//const rootFolder = "C:\\_catalogWork\\_reducedPdfs\\Treasures28 (1253)"
const rootFolder = "C:\\tmp"
_execute(rootFolder)
console.log(`Final Report
TOTAL (${TOTAL_FILE_COUNT})
CANT(${CANT_MOVE_FILE_LIST.length}): ${CANT_MOVE_FILE_LIST.join("\n")}
MOVED(${MOVED_FILE_LIST.length}):${MOVED_FILE_LIST.join("\n")}
`)
//yarn run moveLongNames