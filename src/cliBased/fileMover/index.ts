import { getAllPDFFiles, getAllPDFFilesWithIgnorePathsSpecified } from "../../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";

import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { launchWinExplorer } from "./util";
import { isFileInUse } from "../../utils/FileUtils";
import { isPDFCorrupted } from "../../utils/pdfValidator";
import pLimit from "p-limit";

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

export async function moveFilesAndFlatten(sourceDir: string, targetDir: string, pdfOnly = true, ignorePaths = [], preLoadedDestFiles: FileStats[] = null) {
    if (sourceDir === targetDir) {
        return {
            msg: `sourceDir(${sourceDir}) and targetDir(${targetDir}) are same, cancelling move operation`,
            success: false
        };
    }
    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`);

    console.time('getAllSrcPdfs');
    const allSrcPdfs: FileStats[] = await getAllPDFFilesWithIgnorePathsSpecified(sourceDir, ignorePaths);
    console.timeEnd('getAllSrcPdfs');

    if (allSrcPdfs.length === 0) {
        return {
            success: false,
            msg: `Nothing-To-Move. No files found in source dir ${sourceDir}`
        };
    }

    console.time('checkIfAnyFileInUse');
    const inUseCheck = await checkIfAnyFileInUse(allSrcPdfs);
    console.timeEnd('checkIfAnyFileInUse');
    if (inUseCheck.success === false) {
        return inUseCheck;
    }

    let allDestPdfs: FileStats[];
    if (preLoadedDestFiles) {
        console.log('Using pre-loaded destination files.');
        allDestPdfs = preLoadedDestFiles;
    } else {
        console.time('getAllPDFFiles (Dest)');
        allDestPdfs = await getAllPDFFiles(targetDir);
        console.timeEnd('getAllPDFFiles (Dest)');
    }

    console.time('checkCollision');
    const collisionCheck = checkCollision(allSrcPdfs, allDestPdfs);
    console.timeEnd('checkCollision');

    if (collisionCheck.success === false) {
        return collisionCheck;
    }

    const _count = allSrcPdfs?.length;
    const fileCollisionsResolvedByRename = [];
    const filesMoved = [];
    const filesAbsPathMoved = [];
    const filesMovedNewAbsPath = [];
    const errorList = [];

    const limit = pLimit(10); // Concurrency limit

    console.time('moveFilesParallel');
    const movePromises = allSrcPdfs.map(fileStat => limit(async () => {
        const sourceFile = fileStat.absPath;
        const fileName = fileStat.fileName;

        const moveAFileRes = await moveAFile(sourceFile, targetDir, fileName, pdfOnly);

        if (moveAFileRes.renamedWithoutCollision) {
            filesMoved.push(fileName);
            filesAbsPathMoved.push(sourceFile);
            filesMovedNewAbsPath.push(moveAFileRes.targetFile);
        } else if (moveAFileRes.fileCollisionsResolvedByRename) {
            filesMoved.push(fileName);
            filesAbsPathMoved.push(sourceFile);
            fileCollisionsResolvedByRename.push(moveAFileRes.fileCollisionsResolvedByRename);
            filesMovedNewAbsPath.push(moveAFileRes.targetFile);
        } else if (moveAFileRes.error) {
            errorList.push(moveAFileRes.error);
        }
    }));

    await Promise.all(movePromises);
    console.timeEnd('moveFilesParallel');

    const successfulMoves = filesMoved.length;
    const msg = `${successfulMoves} of ${_count} files moved from Source dir ${sourceDir} to target dir ${targetDir}`;
    console.log(msg);

    // Optional: Only launch explorer if explicitly requested or in certain conditions
    // For now keeping it but we could make it optional to speed up response
    // await launchWinExplorer(targetDir);
    // await launchWinExplorer(sourceDir);

    return {
        success: errorList.length === 0 && successfulMoves === _count,
        msg,
        srcPdfsBefore: _count,
        srcPdfsAfter: _count - successfulMoves,
        destFilesBefore: allDestPdfs?.length,
        destFilesAfter: allDestPdfs?.length + successfulMoves,
        fileCollisionsResolvedByRename,
        filesMoved,
        filesAbsPathMoved,
        filesMovedNewAbsPath,
        errorList: errorList
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
    // Optimize: Use Set for O(1) lookup
    const allDestFileNames = new Set(allDestPdfs.map((x) => x.fileName));

    console.log(`Checking collision for ${allSrcFileNames.length} source files against ${allDestFileNames.size} dest files`);

    const matchingFiles = allSrcFileNames.filter(file => allDestFileNames.has(file));
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

