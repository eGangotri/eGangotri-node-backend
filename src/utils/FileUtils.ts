import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import { promisify } from 'util';

import * as path from 'path';

import { FileStats } from "imgToPdf/utils/types";
import { getAllFileListingWithFileSizeStats } from './FileStatsUtils';

import * as Mirror from "../mirror/FrontEndBackendCommonCode"

interface FileInfo {
    size: string;
    absPath: string;
    file: string;
    file2?: string;
}

interface FileSizeComparisonResult {
    msg: string;
    metadata1Length: number;
    metadata2Length: number;
    diff1: number;
    diff2: number;
    dupLength: number;
    revDupLength: number;
    duplicates?: FileInfo[];
    reverseDuplicates?: FileInfo[];
    disjointSet?: FileInfo[];
    reverseDisjointSet?: FileInfo[];
    [key: string]: any; // For the dynamic CSV properties
}

export const isValidDirectory = async (dirPath: string): Promise<boolean> => {
    try {
        const stats = await fsPromise.stat(dirPath);
        return stats.isDirectory();
    } catch (error) {
        return false;
    }
};

export const isValidPath = (filePath: string): boolean => {
    try {
        // Normalize the path to resolve `.`, `..`, and duplicate separators
        const normalizedPath = path.normalize(filePath.trim());
        console.log(`Normalized Path: ${normalizedPath}`);

        // Check for invalid characters based on the platform
        if (process.platform === 'win32') {
            // Split the path into drive letter and the rest of the path
            const [driveLetter, restOfPath] = normalizedPath.split(/^([A-Za-z]:\\)(.*)/).filter(Boolean);

            // Check if the drive letter is valid (e.g., "F:\")
            if (!driveLetter || !/^[A-Za-z]:\\$/.test(driveLetter)) {
                console.log(`Invalid drive letter: ${driveLetter}`);
                return false;
            }

            // Check the rest of the path for invalid characters
            const invalidChars = /[<>:"|?*]/;
            if (invalidChars.test(restOfPath)) {
                console.log(`Invalid characters found in path: ${restOfPath}`);
                return false;
            }
        } else {
            // For non-Windows platforms, check for null characters
            const invalidChars = /[\0]/;
            if (invalidChars.test(normalizedPath)) {
                console.log(`Invalid characters found in path: ${normalizedPath}`);
                return false;
            }
        }

        // Check if the normalized path is absolute
        if (!path.isAbsolute(normalizedPath)) {
            console.log(`Path is not absolute: ${normalizedPath}`);
            return false;
        }

        console.log(`***isValidPath: ${normalizedPath}`);
        return true;
    } catch (err) {
        // If any error occurs, return false
        console.log(`Error occurred: ${err.message}`);
        return false;
    }
};

export const checkFolderExistsAsync = async (folderPath: string): Promise<boolean> => {
    try {
        const stats = await fsPromise.stat(folderPath);
        console.log(`***stats: ${stats.isDirectory()}`)
        return stats.isDirectory(); // Returns true only if it's a directory
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`***not exists: `)

            return false; // Folder does not exist
        }
        throw err; // Re-throw other errors
    }
};

export const checkFolderExistsSync = (folderPath: string): boolean => {
    try {
        fs.accessSync(folderPath);
        return true; // Folder exists
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false; // Folder does not exist
        }
        throw err; // Re-throw other errors (e.g., permission issues)
    }
};
export function removeFolderWithContents(folder: string) {
    fs.rm(folder, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
    })
}

export const countPDFsInFolder = async (folderPath: string,
    ignoreFolders: string[] = ["2#@#$JIESFSF"]): Promise<number> => {
    let pdfCount = 0;

    const readDirRecursive = async (dir: string) => {
        const entries = await fsPromise.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (ignoreFolders.includes(entry.name)) {
                    console.log(`Ignoring folder: ${fullPath}`);
                    continue;
                }
                await readDirRecursive(fullPath);
            } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf') {
                pdfCount++;
            }
        }
    };

    await readDirRecursive(folderPath);
    return pdfCount;
};


export const removeExcept = async (folder: any, except: Array<string>) => {
    const contentList = await fsPromise.readdir(folder);
    const files = contentList.map((x) => folder + "\\" + x).filter((y) => {
        console.log(`Found ${y}`);
        return !except.includes(y);
    });

    for (const file of files) {
        try {
            await fsPromise.unlink(file);
            console.log(`${file} was deleted`);
        } catch (err) {
            console.error(`Error deleting ${file}: ${err}`);
        }
    }
}
export const findInvalidFilePaths = async (filePaths: string[]): Promise<string[]> => {
    const invalidPaths: string[] = [];

    // Check each path in parallel for better performance
    await Promise.all(filePaths.map(async (filePath) => {
        try {
            // Resolve relative paths to absolute paths
            const absolutePath = path.resolve(filePath);

            // Check if the path exists and is accessible
            await fsPromise.access(absolutePath);
        } catch (error) {
            // If access fails, add to invalid paths
            invalidPaths.push(filePath);
        }
    }));

    return invalidPaths;
}

export const createFolderIfNotExistsAsync = async (dirPath: string) => {
    try {
        await fsPromise.access(dirPath);
    } catch {
        await fsPromise.mkdir(dirPath, { recursive: true });
    }
}

export const checkIfEmpty = async (srcPath: string): Promise<boolean> => {
    if (!srcPath) {
        console.log('srcPath is empty.');
        return true;
    }

    try {
        const files = await fsPromise.readdir(srcPath);
        for (const file of files) {
            const filePath = path.join(srcPath, file);
            const stats = await fsPromise.stat(filePath);

            if (stats.isFile()) {
                console.log('The directory has at least one file.');
                return false;
            }

            if (stats.isDirectory()) {
                const isEmpty = await checkIfEmpty(filePath);
                if (!isEmpty) {
                    return false;
                }
            }
        }
    } catch (err) {
        console.error(`Error reading directory: ${err}`);
        return true;
    }

    console.log('The directory is empty.');
    return true;
};

export const getDuplicatesOrUniquesBySize =
    async (folder: string, folder2: string, findDisjoint = false): Promise<FileSizeComparisonResult> => {
        const metadata = await getAllFileListingWithFileSizeStats(folder);
        const metadata2 = await getAllFileListingWithFileSizeStats(folder2);

        if (findDisjoint) {
            const disjointSet = disjointSetByFileSize(metadata2, metadata)
            const reverseDisjointSet = disjointSetByFileSize(metadata2, metadata)
            return {
                msg: `${metadata.length} files in ${folder} 
            and ${metadata2.length} files in ${folder2}
            with ${disjointSet.length} uniques by size.`,

                metadata1Length: metadata.length,
                metadata2Length: metadata2.length,
                diff1: metadata.length - disjointSet.length,
                diff2: metadata2.length - reverseDisjointSet.length,
                dupLength: disjointSet.length,
                revDupLength: reverseDisjointSet.length,
                disjointSet,
                reverseDisjointSet,
                [`"disjointSetASCSV"(${disjointSet?.length})`]: disjointSet.map((x: FileInfo) => x.absPath).join(","),
                [`"reverseDisjointSetASCSV"(${reverseDisjointSet?.length})`]: reverseDisjointSet.map((x: FileInfo) => x.absPath).join(","),
            }
        }
        else {
            const duplicates = duplicateBySizeCheck(metadata, metadata2)
            const reverseDuplicates = duplicateBySizeCheck(metadata2, metadata)
            return {
                msg: `${metadata.length} files in ${folder} and 
            ${metadata2.length} files in ${folder2} 
            with ${duplicates.length} duplicates by size.`,
                metadata1Length: metadata.length,
                metadata2Length: metadata2.length,
                diff1: metadata.length - duplicates.length,
                diff2: metadata2.length - reverseDuplicates.length,
                dupLength: duplicates.length,
                revDupLength: reverseDuplicates.length,
                duplicates,
                reverseDuplicates,
                [`"duplicatesASCSV"(${duplicates?.length})`]: duplicates.map((x: FileInfo) => x.absPath).join(","),
                [`"reverseDuplicatesASCSV"(${reverseDuplicates?.length})`]: reverseDuplicates.map((x: FileInfo) => x.absPath).join(","),
            }
        }
    }

export const moveDuplicatesOrDisjointSetBySize = async (folder1: string, folder2: string, findDisjoint: boolean = false, tmpFolder: string = "_tmp") => {
    const _forMoving = await getDuplicatesOrUniquesBySize(folder1, folder2, findDisjoint);
    const _itemsMoved: { absPath: string, destPath: string }[] = [];
    const _items: FileInfo[] = []
    if (folder1 === folder2) {
        _items.push(...(findDisjoint ? _forMoving.disjointSet : _forMoving.duplicates));
        // Track files by size to keep just one copy
        const processedSizes = new Set<string>();

        _items.forEach((x: FileInfo) => {
            const absPath = x.absPath;
            const fileSize = x.size;

            // If we've already kept a file with this size, move this one to _tmp
            if (processedSizes.has(fileSize)) {
                const fileDir = path.dirname(absPath);
                const tmpDir = path.join(fileDir, tmpFolder);

                // Create _tmp directory if it doesn't exist
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                let destPath = path.join(tmpDir, path.basename(absPath));
                // Handle name collisions by adding a number suffix if file already exists
                let counter = 1;
                while (fs.existsSync(destPath)) {
                    const ext = path.extname(absPath);
                    const baseName = path.basename(absPath, ext);
                    destPath = path.join(tmpDir, `${baseName}_${counter}${ext}`);
                    counter++;
                }
                try {
                    fs.renameSync(absPath, destPath);
                    console.log(`Moving ${absPath} to ${destPath}`);
                    _itemsMoved.push({
                        absPath,
                        destPath,
                    });
                }
                catch (e) {
                    console.log(`Error moving file ${absPath} to ${destPath} ${e}`);
                }
            } else {
                // Keep this file (first occurrence of this size)
                processedSizes.add(fileSize);
                console.log(`Keeping ${absPath} as the first copy for size ${fileSize}`);
            }
        });
        console.log(`Kept ${processedSizes.size} files (one per size) and moved ${_itemsMoved.length} ${findDisjoint ? "disjoint" : "duplicates"} to _tmp.`);
        return {
            moveMsg: _itemsMoved.length > 0 ?
                `Kept ${processedSizes.size} files (one per size) and moved ${_itemsMoved.length} ${findDisjoint ? "disjoint" : "duplicates"} to _tmp.` :
                "No duplicates found, nothing moved",
            _itemsMoved,
            ..._forMoving,
        }
    }

    else {
        // For different folders, we only want to move duplicates from folder2
        // For disjoint, we want files in folder2 that don't exist in folder1
        // For duplicates, we want files in folder2 that have duplicates in folder1
        const itemsToMove = findDisjoint ? _forMoving.disjointSet : _forMoving.duplicates;
        
        console.log(`Moving ${itemsToMove.length} items from folder1 only (${findDisjoint ? "disjoint" : "duplicates"})`)
        
        itemsToMove.forEach((x: FileInfo) => {
            const absPath = x.absPath;
            const fileDir = path.dirname(absPath);
            const tmpDir = path.join(fileDir, tmpFolder);

            // Create _tmp directory if it doesn't exist
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            let destPath = path.join(tmpDir, path.basename(absPath));
            // Handle name collisions by adding a number suffix if file already exists
            let counter = 1;
            while (fs.existsSync(destPath)) {
                const ext = path.extname(absPath);
                const baseName = path.basename(absPath, ext);
                destPath = path.join(tmpDir, `${baseName}_${counter}${ext}`);
                counter++;
            }
            try {
                fs.renameSync(absPath, destPath);
                console.log(`Moving ${absPath} to ${destPath}`);
                _itemsMoved.push({
                    absPath,
                    destPath,
                });
            }
            catch (e) {
                console.log(`Error moving file ${absPath} to ${destPath} ${e}`);
            }
        });
        
        console.log(`Moved ${_itemsMoved.length} ${findDisjoint ? "disjoint" : "duplicates"} 
            from folder1 to _tmp. Left folder2 intact.`);
        return {
            moveMsg: _itemsMoved.length > 0 ?
                `Moved ${_itemsMoved.length} ${findDisjoint ? "disjoint" : "duplicates"} from folder1
                 to _tmp. Left folder2 intact.` :
                "No files found to move from folder1",
            _itemsMoved,
            ..._forMoving,
        }
    }
}


const disjointSetByFileSize = (metadata: FileStats[], metadata2: FileStats[]) => {
    const disjointSet: FileInfo[] = [];
    console.log(`metadata ${JSON.stringify(metadata[0].size)} metadata2 ${JSON.stringify(metadata2[0].size)}`)
    metadata.forEach((file: FileStats) => {
        const match = metadata2.find((file2: FileStats) => {
            if (file.rawSize === file2.rawSize && file.fileName !== file2.fileName) {
                console.log(`rawSize ${file.fileName}(${file.rawSize}) ${file2?.fileName}(${file2?.rawSize})`);
            }
            return (file.rawSize === file2.rawSize && file.fileName !== file2.fileName);
        });

        // Check if match is undefined or null
        if (!match) {
            disjointSet.push({
                size: Mirror.sizeInfo(file.rawSize),
                absPath: file.absPath,
                file: file.fileName,
            });
        }
    });
    console.log(`disjointSet ${JSON.stringify(disjointSet[0])} ${disjointSet.length}`)

    return disjointSet;
}

const duplicateBySizeCheck = (metadata: FileStats[], metadata2: FileStats[]) => {
    const duplicates: FileInfo[] = [];
    console.log(`metadata ${JSON.stringify(metadata[0].size)} metadata2 ${JSON.stringify(metadata2[0].size)}`)
    metadata.forEach((file: FileStats) => {
        const match = metadata2.find((file2: FileStats) => {
            if (file.rawSize === file2.rawSize && file.fileName !== file2.fileName) {
                console.log(`rawSize ${file.fileName}(${file.rawSize}) ${file2?.fileName}(${file2?.rawSize})`)
            }
            return (file.rawSize === file2.rawSize && file.fileName !== file2.fileName)
        });
        //console.log(`match ${JSON.stringify(match)}`)
        if (match?.fileName.length > 0) {
            duplicates.push({
                size: Mirror.sizeInfo(file.rawSize),
                file: file.fileName,
                file2: match?.fileName,
                absPath: file.absPath,
            });
        }
    });
    return duplicates;
}

export const isFileInUse = async (file: string): Promise<boolean> => {
    try {
        const fd = await fsPromise.open(file, 'r+');
        await fd.close();
        return false;
    } catch (err) {
        return true;
    }
};