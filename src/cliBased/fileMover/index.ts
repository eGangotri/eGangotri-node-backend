import { isFileInUse } from "../../archiveDotOrg/fileUtils";
import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils";
import { FileStats } from "imgToPdf/utils/types";

import * as path from 'path';
import * as fs from 'fs';

export async function moveFilesAndFlatten(sourceDir: string, targetDir: string, pdfOnly = true) {
    //implement alogrithm
    //(1) check if any file is open or any file is already present in source Dir
    // if yes then send msg otherwise continut
    if (sourceDir === targetDir) {
        return {
            msg: `sourceDir(${sourceDir}) and targetDir(${targetDir}) are same, cancelling move operation`,
            success: false
        };
    }
    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`);
    let counter = 0;
    let dirs = [sourceDir];
    const filesMoved = [];
    const allSrcPdfs: FileStats[] = await getAllPDFFiles(sourceDir);
    const fileCollisionsResolvedByRename = [];
    if (allSrcPdfs.length === 0) {
        return {
            success: false,
            msg: `Nothing-To-Move.No files found in source dir ${sourceDir}`
        };
    }

    const inUseCheck = checkIfAnyFileInUse(allSrcPdfs);
    if (inUseCheck.success === false) {
        return inUseCheck;
    }
    //check for collisions
    const allDestPdfs: FileStats[] = await getAllPDFFiles(targetDir);
    const collisionCheck = checkCollision(allSrcPdfs, allDestPdfs);

    if (collisionCheck.success === false) {
        return collisionCheck;
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
                if (!pdfOnly || (pdfOnly && file.name.endsWith('.pdf'))) {
                    filesMoved.push(`${++counter}/${_count}). ${file.name}`);
                    if (!fs.existsSync(targetFile)) {
                        fs.renameSync(sourceFile, targetFile);
                    }
                    else {
                        console.log(`File already exists in target dir ${targetFile}. renaming to ${targetFile}_1`);
                        const extension = path.extname(targetFile);

                        const newName = `${targetFile.replace(`.${extension}`,`_1.${extension}`)}`
                        if (!fs.existsSync(newName)) {
                            fs.renameSync(sourceFile, newName);
                            fileCollisionsResolvedByRename.push(`${file.name}`);
                        }

                    }
                }
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
        fileCollisionsResolvedByRename,
        filesMoved
    };
}

const checkIfAnyFileInUse = (allSrcPdfs: FileStats[]) => {
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
    else {
        return {
            success: true,
        };
    }
}

const checkCollision = (allSrcPdfs: FileStats[], allDestPdfs: FileStats[]) => {
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
    return {
        success: true
    }
}

// const filePath = "D:\\_playground\\_dhanuShriPlayground\\DONE_RENAMING\\15-Feb-(53)-DHANU";
// const profile = "KANGRI";
// const destPath = getFolderInSrcRootForProfile(profile)
// Usage
//moveFilesAndFlatten(filePath, destPath);
//moveFilesWithFolders(filePath,destPath);
//yarn run moveFilesToProfile