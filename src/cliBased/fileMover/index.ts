import { isFileInUse } from "../../archiveDotOrg/fileUtils";
import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils";
import { FileStats } from "imgToPdf/utils/types";

const path = require('path');
const fs = require('fs');

export async function moveFilesAndFlatten(sourceDir: string, targetDir: string) {
    //implement alogrithm
    //(1) check if any file is open or any file is already present in source Dir
    // if yes then send msg otherwise continut
    if (sourceDir === targetDir) {
        return {
            msg: `sourceDir and targetDir are same, cancelling move operation`,
            success: false
        };
    }
    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`);
    let counter = 0;
    let dirs = [sourceDir];
    const filesMoved = [];
    const fileCollision = [];
    const allSrcPdfs: FileStats[] = await getAllPDFFiles(sourceDir);
    if (allSrcPdfs.length === 0) {
        return {
            success: false,
            msg: `Nothing-To-Move.No files found in source dir ${sourceDir}`
        };
    }
    //check if any is in use
    const filesInUse = allSrcPdfs.filter(file => isFileInUse(file.absPath));
    if (filesInUse.length > 0) {
        console.error(`Following files are in use, cancelling move operation: ${filesInUse.map(file => file.fileName)}`);
        return {
            success: false,
            msg: `Following files are in use, cancelling move operation`,
            filesInUse: filesInUse.map(file => file.absPath)
        };
    }

    //check for collisions
    const allDestPdfs: FileStats[] = await getAllPDFFiles(targetDir);
    const allSrcFileNames = allSrcPdfs.map((x) => x.fileName);
    const allDestFileNames = allDestPdfs.map((x) => x.fileName);
    console.log(`allSrcFileNames ${allSrcFileNames}
     allDestFileNames ${allDestFileNames}`)
    const matchingFiles = allSrcFileNames.filter(file => allDestFileNames.includes(file));
    if (matchingFiles.length > 0) {
        console.error(`Following files are already present in target dir, cancelling move operation: ${matchingFiles}`);
        return {
            success: false,
            msg: `Following files are already present in target dir, cancelling move operation`,
            matchingFiles
        };
    }
    const _count = allSrcPdfs?.length;
    while (dirs.length > 0) {
        const currentDir = dirs.pop();
        const files = fs.readdirSync(currentDir, { withFileTypes: true });

        for (let file of files) {
            const sourceFile = path.join(currentDir, file.name);

            if (file.isDirectory()) {
                dirs.push(sourceFile);
            } else {
                const targetFile = path.join(targetDir, file.name);

                if (fs.existsSync(targetFile)) {
                    console.error(`File collision detected, cancelling move operation: ${targetFile}`);
                    fileCollision.push(file.name);
                    return {
                        filesMovedLength: filesMoved?.length,
                        filesMoved,
                        fileCollision
                    };
                }
                filesMoved.push(`${++counter}/${_count}). ${file.name}`);
                fs.renameSync(sourceFile, targetFile);
                //console.log(`Moved file: ${targetFile}`);
            }
        }
    }
    const msg = `All files moved from Source dir ${sourceDir}(${_count})  to target dir ${targetDir}`
    console.log(msg);
    const allSrcPdfsAfter: FileStats[] = await getAllPDFFiles(sourceDir);
    const allDestPdfsAfter: FileStats[] = await getAllPDFFiles(targetDir);

    return {
        success: (allSrcPdfsAfter?.length === 0 && ((allDestPdfsAfter?.length - allDestPdfs?.length) === _count)),
        msg,
        srcPdfsBefore: _count,
        srcPdfsAfter: allSrcPdfsAfter?.length,
        destFilesBefore: allDestPdfs?.length,
        destFilesAfter: allDestPdfsAfter?.length,
        filesMoved
    };
}

// const filePath = "D:\\_playground\\_dhanuShriPlayground\\DONE_RENAMING\\15-Feb-(53)-DHANU";
// const profile = "KANGRI";
// const destPath = getFolderInSrcRootForProfile(profile)
// Usage
//moveFilesAndFlatten(filePath, destPath);
//moveFilesWithFolders(filePath,destPath);
//yarn run moveFilesToProfile