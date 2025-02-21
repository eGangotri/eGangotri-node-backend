import { isFileInUse } from "../../archiveDotOrg/fileUtils";
import { getAllPDFFiles, getAllPDFFilesWithIgnorePathsSpecified } from "../../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";

import * as path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import { launchWinExplorer } from "./util";

export const moveAFile = async (sourceFileAbsPath: string, targetDir: string, fileName: string, pdfOnly = true) => {
    const targetFile = path.join(targetDir, fileName);
    const result = { fileCollisionsResolvedByRename: "", renamedWithoutCollision: "", error: "", targetFile: "" };

    if (!pdfOnly || (pdfOnly && fileName.endsWith('.pdf'))) {
        try {
            if (!fs.existsSync(targetFile)) {
                await fsPromise.rename(sourceFileAbsPath, targetFile);
                result.renamedWithoutCollision = `${fileName}`;
                result.targetFile = targetFile;
            } else {
                const extension = path.extname(targetFile); // .pdf with .
                const newName = `${targetFile.replace(`${extension}`, `_1${extension}`)}`;
                console.log(`File (${extension}) already exists in target dir ${targetFile}. Renaming to ${newName}`);
                if (!fs.existsSync(newName)) {
                    await fsPromise.rename(sourceFileAbsPath, newName);
                    result.fileCollisionsResolvedByRename = `${fileName}`;
                    console.log(`File already exists in target dir ${targetFile}. Renaming to ${newName}`);
                } else {
                    console.error(`File already exists in target dir ${targetFile}. Renaming to ${newName} failed`);
                    result.error = `File already exists in target dir ${targetFile}. Renaming to ${newName} failed`;
                }
            }
        } catch (err) {
            result.error = `Error moving file ${sourceFileAbsPath}: ${err.message}`;
        }
    }
    return result;
};

export async function moveFilesAndFlatten(sourceDir: string, targetDir: string, pdfOnly = true, ignorePaths = []) {
    if (sourceDir === targetDir) {
        return {
            msg: `sourceDir(${sourceDir}) and targetDir(${targetDir}) are same, cancelling move operation`,
            success: false
        };
    }
    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`);

    const allSrcPdfs: FileStats[] = await getAllPDFFilesWithIgnorePathsSpecified(sourceDir, ignorePaths);
    if (allSrcPdfs.length === 0) {
        return {
            success: false,
            msg: `Nothing-To-Move. No files found in source dir ${sourceDir}`
        };
    }

    const inUseCheck = checkIfAnyFileInUse(allSrcPdfs);
    if (inUseCheck.success === false) {
        return inUseCheck;
    }

    const allDestPdfs: FileStats[] = await getAllPDFFiles(targetDir);
    const collisionCheck = checkCollision(allSrcPdfs, allDestPdfs);
    if (collisionCheck.success === false) {
        return collisionCheck;
    }

    const _count = allSrcPdfs?.length;
    const fileCollisionsResolvedByRename = [];
    const filesMoved = [];
    const filesAbsPathMoved = [];
    const filesMovedNewAbsPath = [];
    const errorList = [];

    const dirs = [sourceDir];
    while (dirs.length > 0) {
        const currentDir = dirs.pop();
        const files = await fsPromise.readdir(currentDir, { withFileTypes: true });

        for (let file of files) {
            const sourceFile = path.join(currentDir, file.name);

            if (file.isDirectory()) {
                dirs.push(sourceFile);
            } else if (ignorePaths && ignorePaths.some((item: string) => sourceFile.includes(item))) {
                console.log(`:Ignoring ${sourceFile} due to ${ignorePaths}:`);
                continue;
            } else {
                filesMoved.push(`${file.name}`);
                filesAbsPathMoved.push(sourceFile);
                const moveAFileRes = await moveAFile(sourceFile, targetDir, file.name, pdfOnly);

                if (moveAFileRes.renamedWithoutCollision) {
                    filesMovedNewAbsPath.push(moveAFileRes.targetFile);
                } else if (moveAFileRes.error) {
                    errorList.push(moveAFileRes.error);
                } else if (moveAFileRes.fileCollisionsResolvedByRename) {
                    fileCollisionsResolvedByRename.push(moveAFileRes.fileCollisionsResolvedByRename);
                }
            }
        }
    }

    const msg = `All ${_count} files moved from Source dir ${sourceDir} to target dir ${targetDir}`;
    console.log(msg);

    const allSrcPdfsAfter: FileStats[] = await getAllPDFFiles(sourceDir);
    const allDestPdfsAfter: FileStats[] = await getAllPDFFiles(targetDir);
    await launchWinExplorer(targetDir);
    await launchWinExplorer(sourceDir);

    return {
        success: (allSrcPdfsAfter?.length === 0 && ((allDestPdfsAfter?.length - allDestPdfs?.length) === _count)),
        msg,
        srcPdfsBefore: _count,
        srcPdfsAfter: allSrcPdfsAfter?.length,
        destFilesBefore: allDestPdfs?.length,
        destFilesAfter: allDestPdfsAfter?.length,
        fileCollisionsResolvedByRename,
        filesMoved,
        filesAbsPathMoved,
        filesMovedNewAbsPath,
        errors: errorList
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
