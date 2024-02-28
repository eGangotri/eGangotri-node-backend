const path = require('path');
const fs = require('fs');
import { getFolderInSrcRootForProfile } from "../../cliBased/utils";

export function moveFilesWithFolders(sourceDir: string, targetDir: string) {
    fs.readdir(sourceDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(`Unable to read directory: ${err}`);
            return;
        }

        for (let file of files) {
            const sourceFile = path.join(sourceDir, file.name);
            const targetFile = path.join(targetDir, file.name);

            if (file.isDirectory()) {
                // Create the new directory
                if (!fs.existsSync(targetFile)) {
                    fs.mkdirSync(targetFile);
                }
                // Recursively move files
                moveFilesWithFolders(sourceFile, targetFile);
            } else {
                // Check if file already exists in the target directory
                if (fs.existsSync(targetFile)) {
                    console.error(`File collision detected, cancelling move operation: ${targetFile}`);
                    return;
                }

                // Move the file
                fs.rename(sourceFile, targetFile, err => {
                    if (err) {
                        console.error(`Unable to move file: ${err}`);
                    } else {
                        console.log(`Moved file: ${targetFile}`);
                    }
                });
            }
        }
    });
}

export function moveFilesAndFlatten(sourceDir: string, targetDir: string) {
    console.log(`sourceDir ${sourceDir} targetDir ${targetDir}`)
    fs.readdir(sourceDir, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(`Unable to read directory: ${err}`);
        }

        for (let file of files) {
            const sourceFile = path.join(sourceDir, file.name);

            if (file.isDirectory()) {
                // Recursively move files
                moveFilesAndFlatten(sourceFile, targetDir);
            } else {
                // Check if file is a PDF
                // if (path.extname(file.name) !== '.pdf') {
                //     continue;
                // }

                const targetFile = path.join(targetDir, file.name);

                // Check if file already exists in the target directory
                if (fs.existsSync(targetFile)) {
                    console.error(`File collision detected, cancelling move operation: ${targetFile}`);
                    return;
                }

                // Move the file
                fs.rename(sourceFile, targetFile, err => {
                    if (err) {
                        console.error(`Unable to move file: ${err}`);
                    } else {
                        console.log(`Moved file: ${targetFile}`);
                    }
                });
            }
        }
    });
}


// const filePath = "D:\\_playground\\_dhanuShriPlayground\\DONE_RENAMING\\15-Feb-(53)-DHANU";
// const profile = "KANGRI";
// const destPath = getFolderInSrcRootForProfile(profile)
// Usage
//moveFilesAndFlatten(filePath, destPath);
//moveFilesWithFolders(filePath,destPath);
//yarn run moveFilesToProfile