import { PYTHON_SERVER_URL } from "../db/connection";
import { countPDFsInFolder, createDirIfNotExists, isValidDirectory } from "../utils/FileUtils";
import fs from 'fs';
import path from 'path';


export const runPthonPdfExtractionInLoop = async (_srcFolders: string[],
    commonDest: string,
    firstNPages: number,
    lastNPages: number) => {
    const combinedResults = [];
    let specificDest = commonDest;
    for (let srcFolder of _srcFolders) {
        try {
            console.log(`runPthonPdfExtractionInLoop srcFolder ${srcFolder} `);
            const pdfsToReduceCount = await countPDFsInFolder(srcFolder, ["reduced"]);
            if (isValidDirectory(commonDest)) {
                await createDirIfNotExists(commonDest);
            }
            else {
                specificDest = `${srcFolder}\\reduced`;
            }
            console.log(`runPthonPdfExtractionInLoop srcFolder ${srcFolder} specificDest ${specificDest} firstNPages ${firstNPages} lastNPages ${lastNPages}`);

            const _resp = await executePythonPostCall(
                {
                    "input_folder": srcFolder,
                    "output_folder": specificDest,
                    firstNPages,
                    lastNPages
                }, 'extractFromPdf');

            const destRootDump = `${specificDest}\\${path.basename(srcFolder)}(${pdfsToReduceCount})`;
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
            console.log('Error runPthonPdfExtractionInLoop:', err);
            combinedResults.push({
                err,
                msg: `Exception ${srcFolder}`,
                success: false,
                _srcFolder: srcFolder,
                destRoot: specificDest,
            });
        }
    }
    return combinedResults;
}

export const runPythonCopyPdfInLoop = async (_srcFolders: string[],
    commonDest: string) => {
    const combinedResults = [];
    let specificDest = `${commonDest}`;
    for (let srcFolder of _srcFolders) {
        try {
            console.log(`runPthonCopyPdfInLoop srcFolder ${srcFolder} `);
            const pdfsToMoveCount = await countPDFsInFolder(srcFolder, ["-copy"]);
            if (isValidDirectory(commonDest)) {
                specificDest = `${specificDest}\\${path.basename(srcFolder)}(${pdfsToMoveCount})`
                if (!checkFolderExistsSync(`${commonDest}`)) {
                    fs.mkdirSync(`${commonDest}`, { recursive: true });
                    console.log(`Folder created: ${commonDest}`);
                }
                else {
                    console.log(`directory exists: ${commonDest}`);

                }
            }
            else {
                specificDest = `${srcFolder}\\-copy}\\${path.basename(srcFolder)}(${pdfsToMoveCount})`
                if (!checkFolderExistsSync(`${specificDest}`)) {
                    fs.mkdirSync(`${specificDest}`, { recursive: true });
                    console.log(`Copy Folder created: ${specificDest}`);
                }
                console.log(`Folder created: ${specificDest}`);
            }
            console.log(`runPthonCopyPdfInLoop srcFolder ${srcFolder} specificDest ${specificDest}`);

            const _resp = await executePythonPostCall({
                "input_folder": srcFolder,
                "output_folder": specificDest,
            }, 'copyOnlyPdfs');
            console.log(`runPthonCopyPdfInLoop
                 srcFolder ${srcFolder} specificDest ${specificDest} pdfsToMoveCount ${pdfsToMoveCount}
                 _resp ${JSON.stringify(_resp)}`);
            const destRootDump = `${specificDest}\\${path.basename(srcFolder)}(${pdfsToMoveCount})`;
            const pdfsMovedCount = await countPDFsInFolder(destRootDump);
            const result = {
                msg: `${pdfsToMoveCount} pdfs moved to new dest with count ${pdfsMovedCount}`,
                srcFolder,
                destRootDump,
                isReductionCountMatch: pdfsToMoveCount === pdfsMovedCount,
                ..._resp,
            }
            console.log('result', result);
            combinedResults.push(result);
        }
        catch (err) {
            console.log('Error runPthonCopyPdfInLoop:', err);
            combinedResults.push({
                err,
                msg: `Exception ${srcFolder}`,
                success: false,
                _srcFolder: srcFolder,
                destRoot: specificDest,
            });
        }
    }
    return combinedResults;
}


export const runCr2ToJpgInLoop = async (_srcFolders: string[],
    commonDest: string = undefined) => {
    const combinedResults = [];
    let specificDest = ""
    for (let srcFolder of _srcFolders) {
        try {
            specificDest = commonDest ? `${commonDest}` : `${srcFolder}\\-cr2-jpg`;
            console.log(`runCr2ToJpgInLoop srcFolder ${srcFolder} `);
            await createDirIfNotExists(specificDest);
            console.log(`Folder created: ${specificDest}`);
            console.log(`runCr2ToJpgInLoop srcFolder ${srcFolder} specificDest ${specificDest}`);

            const _resp = await executePythonPostCall({
                "cr2_folder": srcFolder,
                "output_jpg_path": specificDest,
            }, 'cr2ToJpg');

            console.log(`runPthonCopyPdfInLoop
                 srcFolder ${srcFolder} specificDest ${specificDest} 
                 _resp ${JSON.stringify(_resp)}`);

            const result = {
                srcFolder,
                specificDest,
                ..._resp,
            }
            console.log('result', result);
            combinedResults.push(result);
        }
        catch (err) {
            console.log('Error runPthonCopyPdfInLoop:', err);
            combinedResults.push({
                err,
                msg: `Exception ${srcFolder}`,
                success: false,
                _srcFolder: srcFolder,
                destRoot: specificDest,
            });
        }
    }
    return combinedResults;
}
const checkPythonServer = async (): Promise<{ success: boolean, message: string }> => {
    // Check if the server is running
    const serverCheckResponse = await fetch(PYTHON_SERVER_URL);
    if (!serverCheckResponse.ok) {
        console.log('Python server is not running');
        return {
            success: false,
            message: 'Python server is not running'
        }
    }
    else {
        console.log('Python server is running');
        return {
            success: true,
            message: 'Python server is running'
        }
    }
};

const executePythonPostCall = async (body: Record<string, unknown>, resource: string): Promise<any> => {
    try {
        const serverStatus = await checkPythonServer();
        if (serverStatus.success) {
            const response = await fetch(`${PYTHON_SERVER_URL}/${resource}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${resource}`);
            }

            const data = await response.json();
            return {
                status: 'success',
                data
            };
        }
        else {
            return serverStatus
        }
    } catch (error) {
        return {
            status: 'failed',
            message: error.message
        };
    }
};
