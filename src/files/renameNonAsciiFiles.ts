import { callAksharamukha, DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL } from "../aksharamukha/convert";
import fs from 'fs';
import path from 'path';
import { getAllFileListingWithoutStats } from "../utils/FileStatsUtils";

export const renameNonAsciiFile = async (
    fileAbsPath: string,
    sourceScript: string,
    targetScript: string = DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
    counter: number
) => {
    //"Tamil"
    const { base: fileNameWithExt, name: fileName, ext } = path.parse(fileAbsPath);
    const payload = {
        "source": sourceScript,
        "target": targetScript,
        "text": fileName,
        "nativize": true,
        "postOptions": [], "preOptions": []
    }

    const _renamedFile = await callAksharamukha(payload);
    console.log(`_renamedFile ${_renamedFile} fileName ${fileName}`)
    if (_renamedFile !== fileName) {
        console.log(`${counter})Renaming ${fileNameWithExt} to ${_renamedFile}${ext}`)
        // Get the directory of the file
        const dir = path.dirname(fileAbsPath);

        const dumpDirectory = path.join(dir, DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL);
        // Create the new file path
        const newFilePath = path.join(dumpDirectory, `${_renamedFile}${ext}`);
        if (!fs.existsSync(dumpDirectory)) {
            fs.mkdirSync(dumpDirectory);
        }
        //deliberately not using async
        // Copy the file
        fs.copyFile(fileAbsPath, newFilePath, function (err) {
            if (err) throw err;
            console.log('File copied!');
        });
        return { old: fileNameWithExt, new: `${_renamedFile}${ext}` }
    }
    return { old: fileNameWithExt, new: "" }
}

export const renameAllNonAsciiInFolder = async (
    folder: string,
    sourceScript: string,
    targetScript: string = DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,

) => {
    let RENAME_COUNTER = 0;

    const files = await getAllFileListingWithoutStats(folder);
    const promises = [];
    for (const file of files) {
        promises.push(renameNonAsciiFile(file.absPath, sourceScript, targetScript, RENAME_COUNTER++))
    }
    const results = await Promise.all(promises);
    console.log(`results: ${JSON.stringify(results)}`);
    return results.filter((item) => item.new !== "");
}

const _fn = "C:\\Users\\chetan\\Downloads\\test";
//renameAllNonAsciiInFolder(_fn, "Tamil");