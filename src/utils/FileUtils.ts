import * as fs from 'fs';
import { promisify } from 'util';

import * as path from 'path';

import { FileStats } from "imgToPdf/utils/types";
import { getAllFileListingWithFileSizeStats } from './FileStatsUtils';

import * as Mirror from "../mirror/FrontEndBackendCommonCode"

interface FileInfo {
    size: string;
    absPath: string;
    file: string;
    file2 ?: string;
}


export function removeFolderWithContents(folder: string) {
    fs.rm(folder, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(err.message);
            return;
        }
    })
}

export const removeExcept = async (folder: any, except: Array<string>) => {
    const contentList = await fs.promises.readdir(folder)
    const files = contentList.map((x) => folder + "\\" + x).filter((y) => {
        console.log(`Found ${y}`)
        return !except.includes(y)
    }).map(e => fs.unlink(e, (err) => {
        if (err) throw err;
        console.log(`${e} was deleted`);
    }))

}


export function createFolderIfNotExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created: ${folderPath}`);
    } else {
        // console.log(`Folder already exists: ${folderPath}`);
    }
}


const _fsPromise = {
    readdir: promisify(fs.readdir),
    stat: promisify(fs.stat)
};

export const checkIfEmpty = async (srcPath: string): Promise<boolean> => {
    if (!srcPath) {
        console.log('srcPath is empty.');
        return true;
    }

    try {
        const files = await _fsPromise.readdir(srcPath);
        for (const file of files) {
            const filePath = path.join(srcPath, file);
            const stats = await _fsPromise.stat(filePath);

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

export const getDuplicatesOrUniquesBySize = async (folder: string, folder2: string, findDisjoint = false) => {
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
            [`"disjointSetASCSV"(${disjointSet?.length})`] : disjointSet.map((x: FileInfo) => x.absPath).join(","),
            [`"reverseDisjointSetASCSV"(${reverseDisjointSet?.length})`] : reverseDisjointSet.map((x: FileInfo) => x.absPath).join(","),
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

const disjointSetByFileSize = (metadata: FileStats[], metadata2: FileStats[]) => {
    const disjointSet:FileInfo[] = [];
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
    const duplicates:FileInfo[] = [];
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
