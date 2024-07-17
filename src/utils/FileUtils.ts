import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

import * as path from 'path';

import { FileStats } from "imgToPdf/utils/types";
import { getAllFileListingWithFileSizeStats } from './FileStatsUtils';

import * as Mirror from "../mirror/FrontEndBackendCommonCode"

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

export const checkIfEmpty = async (srcPath: string) => {
    let empty = true;
    if (srcPath) {
        try {
            const files = await fsPromise.readdir(srcPath);
            for (let file of files) {
                if ((await fsPromise.stat(path.join(srcPath, file))).isFile()) {
                    empty = false;
                    console.log('The directory has at least one file.');
                    break;
                }
            }
        } catch (err) {
            console.error(`Error reading directory: ${err}`);
        }
    } else {
        console.log('srcPath is empty.');
    }
    console.log(`emptyFolder ${empty}`);
    return empty;
}

export const getDuplicatesBySize = async (folder: string, folder2: string) => {
    const metadata = await getAllFileListingWithFileSizeStats(folder);
    const metadata2 = await getAllFileListingWithFileSizeStats(folder2);

    const duplicates = duplicateBySizeCheck(metadata, metadata2)

    const reverseDuplicates = duplicateBySizeCheck(metadata2, metadata)
    return {
        msg: `${metadata.length} files in ${folder} and ${metadata2.length} files in ${folder2} with ${duplicates.length} duplicates by size.`,
        metadata1Length: metadata.length,
        metadata2Length: metadata2.length,
        diff1: metadata.length - duplicates.length,
        diff2: metadata2.length - reverseDuplicates.length,
        dupLength: duplicates.length,
        revDupLength: reverseDuplicates.length,
        duplicates,
        reverseDuplicates,
    }
}

const duplicateBySizeCheck = (metadata: FileStats[], metadata2: FileStats[]) => {
    const duplicates = [];
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
                file2: match?.fileName
            });
        }
    });
    return duplicates;
}
