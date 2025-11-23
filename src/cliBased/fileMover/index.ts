import { getAllPDFFiles, getAllPDFFilesWithIgnorePathsSpecified } from "../../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";

import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { launchWinExplorer } from "./util";
import { isFileInUse } from "../../utils/FileUtils";
import { isPDFCorrupted } from "../../utils/pdfValidator";

// Ensures a unique filename in a directory by appending " (n)" before the extension.
const ensureUniqueFileNameAsync = async (dir: string, originalName: string): Promise<string> => {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    let candidate = originalName;
    let counter = 1;
    while (true) {
        try {
            await fsPromise.access(path.join(dir, candidate));
            candidate = `${base} (${counter})${ext}`;
            counter++;
        } catch (e: any) {
            if (e && e.code === 'ENOENT') {
                return candidate;
            }
            throw e;
        }
    }
};

const moveWithExdevFallback = async (src: string, dest: string) => {
    try {
        await fsPromise.rename(src, dest);
    } catch (err: any) {
        if (err && err.code === 'EXDEV') {
            await fsPromise.copyFile(src, dest);
            await fsPromise.unlink(src);
        } else {
            throw err;
        }
    }
};

export const moveAFile = async (sourceFileAbsPath: string, targetDir: string, fileName: string, pdfOnly = true) => {
    const result = { fileCollisionsResolvedByRename: "", renamedWithoutCollision: "", error: "", targetFile: "" };

    if (!pdfOnly || (pdfOnly && fileName.endsWith('.pdf'))) {
        try {
            if (fileName.endsWith('.pdf')) {
                const corruptionCheck = await isPDFCorrupted(sourceFileAbsPath)
                if (!corruptionCheck.isValid) {
                    result.error = `Corrupted or Non-Existent PDF ${sourceFileAbsPath}`;
                    console.error("Corrupted or Non-Existent PDF: error " + result.error);
                    return result;
                }
            }

            const uniqueName = await ensureUniqueFileNameAsync(targetDir, fileName);
            const targetFileAbs = path.join(targetDir, uniqueName);
            await moveWithExdevFallback(sourceFileAbsPath, targetFileAbs);
            if (uniqueName === fileName) {
                result.renamedWithoutCollision = `${fileName}`;
            } else {
                result.fileCollisionsResolvedByRename = `${fileName}`;
            }
            result.targetFile = targetFileAbs;
        } catch (err) {
            result.error = `Error moving file ${sourceFileAbsPath}: ${err.message}`;
            console.error(`Error moving file ${sourceFileAbsPath}: ${err.message}`);
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

    const inUseCheck = await checkIfAnyFileInUse(allSrcPdfs);
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


    const allSrcPdfsAfter: FileStats[] = await getAllPDFFiles(sourceDir);
    const allDestPdfsAfter: FileStats[] = await getAllPDFFiles(targetDir);
    
    const msg = `${(allDestPdfsAfter?.length - allDestPdfs?.length)} of ${_count}files moved from Source dir ${sourceDir} to target dir ${targetDir}`;
    console.log(msg);
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

const checkIfAnyFileInUse = async (allSrcPdfs: FileStats[]) => {
    // Check if any file is in use
    const filesInUsePromises = allSrcPdfs.map(async (file) => {
        const isUse = await isFileInUse(file.absPath);
        return { file, isUse };
    });

    const filesInUseResults = await Promise.all(filesInUsePromises);
    const filesInUse = filesInUseResults.filter(result => result.isUse).map(result => result.file);

    if (filesInUse.length > 0) {
        console.error(`Following files are in use, cancelling move operation: ${filesInUse.map(file => file.fileName)}`);
        return {
            success: false,
            msg: `Following files are in use, cancelling move operation`,
            filesInUse: filesInUse.map(file => file.absPath)
        };
    } else {
        return {
            success: true,
        };
    }
};

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
