import { getAllFileListingWithoutStats } from "../utils/FileStatsUtils";
import path from 'path';
import { promises as fs } from 'fs';
import { callAksharamukha } from "../aksharamukha/convert";

export const multipleTextScriptConversion = async (folderPath: string, scriptFrom: string, scriptTo: string) => {
    console.log(`folderPath: ${folderPath} scriptFrom: ${scriptFrom} scriptTo: ${scriptTo}`);
    const allDotTxts = await getAllFileListingWithoutStats({
        directoryPath: folderPath,
        filterExt: ['.txt'],
        ignoreFolders: true,
        withLogs: false,
    });

    const scriptConvertedFiles = []
    for (const file of allDotTxts) {
        let x = 0;
        try {
            const fileContents = await fs.readFile(file.absPath, 'utf8');
            const { base: fileNameWithExt, name: fileName, ext } = path.parse(file.absPath);
            const payload = {
                "source": scriptFrom,
                "target": scriptTo,
                "text": fileContents,
                "nativize": true,
                "postOptions": [], "preOptions": []
            }
            console.log(`Contents of ${fileNameWithExt}: ${fileContents}`);

            const scriptConvertedContents = await callAksharamukha(payload, true);
            const dumpDirectory = path.join(folderPath, scriptTo);

            // Ensure the dump directory exists
            await fs.mkdir(dumpDirectory, { recursive: true });

            // Create the new file path
            const newFilePath = path.join(dumpDirectory, `${fileName}${ext}`);
            console.log(`scriptConvertedContents of ${fileNameWithExt}: ${scriptConvertedContents}`);
            // Write the contents to the new file
            await fs.writeFile(newFilePath, scriptConvertedContents, 'utf8');
            console.log(`File written to ${newFilePath}`);
            scriptConvertedFiles.push(newFilePath);
            x++;
            if (x > 5) break;

        } catch (error) {
            console.error(`Error reading file ${file.absPath}:`, error);
        }


    }

    return {
        src: folderPath,
        destination: `${folderPath}/${scriptTo}`,
        msg: `${allDotTxts.length} files renamed from ${folderPath} and copied to ${folderPath}/${scriptTo}.`,
        scriptConvertedFiles,
        allDotTxts: allDotTxts.slice(0, 10)
    };
}