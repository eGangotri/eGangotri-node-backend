import { checkFolderExistsSync, countPDFsInFolder, createDirIfNotExistsAsync, isValidDirectory } from "../utils/FileUtils";
import { makePythonCall } from "./pythonLauncherService";
import fs from 'fs';
import path from 'path';

export const runPthonPdfExtractionInLoopDeprecated = async (_srcFolders: string[],
    destRootFolder: string,
    firstNPages: number,
    lastNPages: number) => {
    const combinedResults = [];
    let destRoot = destRootFolder;
    for (let srcFolder of _srcFolders) {
        try {
            console.log(`runPthonPdfExtractionInLoop srcFolder ${srcFolder} `);
            const pdfsToReduceCount = await countPDFsInFolder(srcFolder, ["reduced"]);
            if (isValidDirectory(destRootFolder)) {
               await createDirIfNotExistsAsync(destRootFolder)
            }
            else {
                destRoot = `${srcFolder}\\reduced`;
            }
            console.log(`runPthonPdfExtractionInLoop srcFolder ${srcFolder} destRoot ${destRoot} firstNPages ${firstNPages} lastNPages ${lastNPages}`);

            const _resp = await makePythonCall(srcFolder, destRoot, firstNPages, lastNPages);
            const destRootDump = `${destRoot}\\${path.basename(srcFolder)}(${pdfsToReduceCount})`;
            const pdfsReducedCount = await countPDFsInFolder(destRootDump);
            const result = {
                msg: `${pdfsToReduceCount} pdfs processed to ${pdfsReducedCount} with first ${firstNPages} and last ${lastNPages} pages`,
                srcFolder,
                destRootDump,
                isReductionCountMatch: pdfsToReduceCount === pdfsReducedCount,
                ..._resp,
            }
            console.log('result', result);
            combinedResults.push(result);
        }
        catch (err) {
            console.log('Error', err);
            combinedResults.push({
                err,
                msg: `Exception ${srcFolder}`,
                success: false,
                _srcFolder: srcFolder,
                destRoot: destRoot,
            });
        }
    }
    return combinedResults;
}