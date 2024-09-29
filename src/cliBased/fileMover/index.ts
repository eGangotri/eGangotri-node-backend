import { isFileInUse } from "../../archiveDotOrg/fileUtils";
import { getAllPDFFiles, getAllPDFFilesWithIgnorePathsSpecified } from "../../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";

import * as path from 'path';
import * as fs from 'fs';
import { launchWinExplorer } from "./util";
import { error } from "console";

export async function moveFilesAndFlatten(sourceDir: string,
    targetDir: string,
    pdfOnly = true,
    ignorePaths = []) {
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
    const allSrcPdfs: FileStats[] = await getAllPDFFilesWithIgnorePathsSpecified(sourceDir, ignorePaths);
    const fileCollisionsResolvedByRename = [];
    const filesMoved = [];
    const errors = []
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
            }
            else if (ignorePaths && ignorePaths.some((item: string) => sourceFile.includes(item))) {
                console.log(`:Ignoring ${sourceFile} due to ${ignorePaths}:`);
                continue;
            }
            else {
                filesMoved.push(`${++counter}/${_count}). ${file.name}`);
                const moveAFileRes = moveAFile(sourceFile, targetDir, file.name, pdfOnly);

                if (moveAFileRes.renamedWithoutCollision.length > 0) {
                    fileCollisionsResolvedByRename.push(moveAFileRes.fileCollisionsResolvedByRename)
                }
                else if (moveAFileRes.error.length > 0) {
                    errors.push(moveAFileRes.error);
                }
                else if (moveAFileRes.fileCollisionsResolvedByRename.length > 0) {
                    fileCollisionsResolvedByRename.push(moveAFileRes.fileCollisionsResolvedByRename)
                }

            }
        }
    }
    const msg = `All ${_count} files moved from Source dir ${sourceDir}  to target dir ${targetDir}`
    console.log(msg);
    const allSrcPdfsAfter: FileStats[] = await getAllPDFFiles(sourceDir);
    const allDestPdfsAfter: FileStats[] = await getAllPDFFiles(targetDir);
    await launchWinExplorer(targetDir)
    await launchWinExplorer(sourceDir)
    return {
        success: (allSrcPdfsAfter?.length === 0 && ((allDestPdfsAfter?.length - allDestPdfs?.length) === _count)),
        msg,
        srcPdfsBefore: _count,
        srcPdfsAfter: allSrcPdfsAfter?.length,
        destFilesBefore: allDestPdfs?.length,
        destFilesAfter: allDestPdfsAfter?.length,
        fileCollisionsResolvedByRename,
        filesMoved,
        errors
    };
}


export const moveAFile = (sourceFileAbsPath: string,
    targetDir: string,
    fileName: string,
    pdfOnly = true) => {
    const targetFile = path.join(targetDir, fileName);
    const result = { fileCollisionsResolvedByRename: "", renamedWithoutCollision: "", error: "" };
    if (!pdfOnly || (pdfOnly && fileName.endsWith('.pdf'))) {
        if (!fs.existsSync(targetFile)) {
            fs.renameSync(sourceFileAbsPath, targetFile);
            result.renamedWithoutCollision = `${fileName}`;
        }
        else {
            const extension = path.extname(targetFile); //.pdf with .
            const newName = `${targetFile.replace(`${extension}`, `_1${extension}`)}`
            console.log(`File (${extension}) already exists in target dir ${targetFile}. renaming to ${newName} `);
            if (!fs.existsSync(newName)) {
                fs.renameSync(sourceFileAbsPath, newName);
                result.fileCollisionsResolvedByRename = `${fileName}`;
                console.log(`File already exists in target dir ${targetFile}. renaming to ${newName}`);
            }
            else {
                console.error(`File already exists in target dir ${targetFile}. renaming to ${newName} failed`);
                result.error = `File already exists in target dir ${targetFile}. renaming to ${newName} failed`;
            }
        }
    }
    return result;
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
    console.log(`allSrcFileNames ${allSrcPdfs.map((x) => x.absPath)}
     allDestFileNames ${allDestPdfs.map((x) => x.absPath)}`)

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
