import { getAllPDFFiles } from "../../imgToPdf/utils/FileUtils";

const path = require('path');
const fs = require('fs');

export async function moveFilesAndFlatten(sourceDir: string, targetDir: string) {
    //implement alogrithm
    //(1) check if any file is open or any file is already present in source Dir
    // if yes then send msg otherwise continut

    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`);
    let counter = 0;
    let dirs = [sourceDir];
    const filesMoved = [];
    const fileCollision = [];
    const _count = (await getAllPDFFiles(sourceDir))?.length;

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
    return {
        msg ,
        filesMovedLength: filesMoved?.length,
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