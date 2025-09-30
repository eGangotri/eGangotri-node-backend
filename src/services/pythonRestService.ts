import { trusted } from "mongoose";
import { PYTHON_SERVER_URL } from "../db/connection";
import { countPDFsInFolder, createFolderIfNotExistsAsync, isValidDirectory } from "../utils/FileUtils";
import path from 'path';
import { ExtractionErrorResult, ExtractionSuccessResult, PythonExtractionResult } from "./types";





export const runPthonPdfExtractionInLoop = async (
    _srcFolders: string[],
    destRootFolders: string[],
    nFirstPages: number,
    nLastPages: number,
    reducePdfSizeAlso = true
): Promise<PythonExtractionResult[]> => {
    const combinedResults: PythonExtractionResult[] = [];
    for (let i = 0; i < _srcFolders.length; i++) {
        let input_folder = _srcFolders[i];
        let destRootFolder = destRootFolders[i];
        try {
            console.log(`runPthonPdfExtractionInLoop srcFolder ${input_folder} destRootFolder ${destRootFolder} `);
            const pdfsToReduceCount = await countPDFsInFolder(input_folder, ["reduced"]);
            if (isValidDirectory(destRootFolder)) {
                await createFolderIfNotExistsAsync(destRootFolder);
            }

            const _payload = {
                "input_folder": input_folder,
                "output_folder": destRootFolder,
                "nFirstPages": nFirstPages,
                "nLastPages": nLastPages,
                "reducePdfSizeAlso": reducePdfSizeAlso
            }
            console.log(`runPthonPdfExtractionInLoop payload: ${JSON.stringify(_payload)}`);

            const _resp = await executePythonPostCall(
                _payload, 'extractFromPdf');

            if (_resp.status) {
                const destRootDump = String(_resp.data?.output_folder ?? "");
                const pdfsReducedCount = await countPDFsInFolder(destRootDump);
                const result = {
                    msg: `${pdfsToReduceCount} pdfs processed to ${pdfsReducedCount} with first ${nFirstPages} and last ${nLastPages} pages`,
                    srcFolder: input_folder,
                    destRootDump,
                    isReductionCountMatch: pdfsToReduceCount === pdfsReducedCount,
                    success: true,
                    ..._resp,
                }
                console.log('result', result);
                combinedResults.push(result);
            }
            else {
                combinedResults.push({
                    err: _resp?.message,
                    msg: `Exception ${input_folder}`,
                    success: false,
                    _srcFolder: input_folder,
                    destRoot: destRootFolder,
                });
                continue;
            }
        }
        catch (err) {
            console.log('Error runPthonPdfExtractionInLoop:', err);
            combinedResults.push({
                err,
                msg: `Exception ${input_folder}`,
                success: false,
                _srcFolder: input_folder,
                destRoot: destRootFolder,
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
                await createFolderIfNotExistsAsync(commonDest);
            }
            else {
                specificDest = `${srcFolder}\\-copy}\\${path.basename(srcFolder)}(${pdfsToMoveCount})`
                await createFolderIfNotExistsAsync(specificDest);
                console.log(`Folder created: ${specificDest}`);
            }
            console.log(`runPthonCopyPdfInLoop srcFolder ${srcFolder} specificDest ${specificDest}`);

            const _resp = await executePythonPostCall({
                "input_folder": srcFolder,
                "output_folder": specificDest,
            }, 'copyOnlyPdfs');

            if (_resp.status) {
                const pdfsMovedCount = await countPDFsInFolder(_resp.data.output_folder);
                const result = {
                    msg: `${pdfsToMoveCount} pdfs moved to new dest with count ${pdfsMovedCount}`,
                    srcFolder,
                    isReductionCountMatch: pdfsToMoveCount === pdfsMovedCount,
                    ..._resp,
                }
                console.log('result', result);
                combinedResults.push(result);
            }
            else {
                combinedResults.push({
                    err: _resp.message,
                    msg: `Exception ${srcFolder}`,
                    success: false,
                    _srcFolder: srcFolder,
                    destRoot: specificDest,
                });
            }
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
            await createFolderIfNotExistsAsync(specificDest);
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
const checkPythonServer = async (): Promise<{ status: boolean, message: string }> => {
    // Check if the server is running
    const serverCheckResponse = await fetch(PYTHON_SERVER_URL);
    if (serverCheckResponse?.ok) {
        console.log('Python server is running');
        return {
            status: true,
            message: 'Python server is running'
        }
    }
    else {
        console.log('Python server is not running');
        return {
            status: false,
            message: 'Python server is not running'
        }
    }
};

export const executePythonPostCall = async (body: Record<string, unknown>, resource: string): Promise<{
    status: boolean;
    message: string;
    data?: {
        input_folder: string;
        output_folder: string;
        nFirstPages: number;
        nLastPages: number;
    };
}> => {
    try {
        const serverStatus = await checkPythonServer();
        if (serverStatus.status) {
            const _res = await pythonPostCallInternal(body, resource);
            return _res
        }
        else {
            return serverStatus
        }
    } catch (error) {
        console.log('Error executePythonPostCall:', error);
        return {
            status: false,
            message: "Python Server could be down"
        };
    }
};

export const pythonPostCallInternal = async (body: Record<string, unknown>, resource: string) => {
    console.log(`python call ${resource} ${JSON.stringify(body, null, 2)}`)
    const response = await fetch(`${PYTHON_SERVER_URL}/${resource}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (response?.ok) {
        const data = await response.json();
        console.log(`data ${JSON.stringify(data, null, 2)}`)
        return {
            status: true,
            message: 'Success',
            data
        };
    }
    else {
       try{
        const errorData = await response.json();
        console.error(`Error ${response.status} from ${resource}:`, JSON.stringify(errorData, null, 2));
        return {
            status: false,
            message: `Error ${response.status} from ${resource}:`,
            data: JSON.stringify(errorData, null, 2)
        };
       }
       catch (error) {
        console.error('Error pythonPostCallInternal:', error);
        return {
            status: false,
            message: JSON.stringify(error, null, 2)
        };  
       }
    }
}   
