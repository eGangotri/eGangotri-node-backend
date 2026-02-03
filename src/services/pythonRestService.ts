import { PYTHON_SERVER_URL } from "../db/connection";
import { countPDFsInFolder, createFolderIfNotExistsAsync, isValidDirectory } from "../utils/FileUtils";
import path from 'path';
import { PythonExtractionResult } from "./types";
import { randomUUID } from "crypto";
import PdfPageExtractionPerItemHistory from "../models/PdfPageExtractionPerItemHistory";
import PdfPageExtractionHistory from "../models/PdfPageExtractionHistory";
import AcrobatHeaderFooterRemovalHistory from "../models/AcrobatHeaderFooterRemovalHistory";
import AcrobatHeaderFooterRemovalPerItemHistory from "../models/AcrobatHeaderFooterRemovalPerItemHistory";

// Default data payload for extraction/copy operations used across the codebase
export interface ExtractionOperationData {
    input_folder: string;
    output_folder: string;
    nFirstPages: number;
    nLastPages: number;
    reducePdfSizeAlso: boolean;
    commonRunId?: string;
    runId?: string;
}

// Strongly typed structures for the merge-PDFs response payload
export interface MergePdfsFileInfo {
    path: string;
    size_mb: number;
    pages: number;
}

export interface MergePdfsDetails {
    first_pdf: MergePdfsFileInfo;
    second_pdf: MergePdfsFileInfo;
    merged_pdf: MergePdfsFileInfo;
    processing_time_seconds: number;
}

export interface MergePdfsResponseData {
    status: 'success' | 'error';
    message: string;
    details: MergePdfsDetails;
}





export const runPthonPdfExtractionInLoop = async (
    _srcFolders: string[],
    destRootFolders: string[],
    nFirstPages: number,
    nLastPages: number,
    reducePdfSizeAlso = true
): Promise<PythonExtractionResult[]> => {

    const combinedResults: PythonExtractionResult[] = [];
    const srcFolderCount = _srcFolders.length;
    const destFolderCount = destRootFolders.length;
    if (srcFolderCount !== destFolderCount) {
        throw new Error("Source and destination folder counts must match");
    }
    const commonRunId = randomUUID();
    try {
        const logEntry = new PdfPageExtractionHistory({
            "_srcFolders": _srcFolders,
            "_destRootFolders": destRootFolders,
            "firstNPages": nFirstPages,
            "lastNPages": nLastPages,
            "reducePdfSizeAlso": reducePdfSizeAlso,
            "commonRunId": commonRunId,
            "srcFolderCount": srcFolderCount,
            "success": false,
        });
        await logEntry.save();
        console.log(`Saved PdfPageExtractionHistory for commonRunId: ${commonRunId} `);
    } catch (logErr) {
        console.error('Error saving PdfPageExtractionHistory:', logErr);
        throw new Error(logErr)
    }

    for (let i = 0; i < srcFolderCount; i++) {
        let input_folder = _srcFolders[i];
        let destRootFolder = destRootFolders[i];
        const runId = randomUUID();
        try {
            console.log(`(${i + 1}/${_srcFolders.length}). runPthonPdfExtractionInLoop srcFolder ${input_folder} destRootFolder ${destRootFolder} `);
            const pdfsToReduceCount = await countPDFsInFolder(input_folder, ["reduced"]);
            if (isValidDirectory(destRootFolder)) {
                await createFolderIfNotExistsAsync(destRootFolder);
            }

            const _payload: ExtractionOperationData = {
                "input_folder": input_folder,
                "output_folder": destRootFolder,
                "nFirstPages": nFirstPages,
                "nLastPages": nLastPages,
                "reducePdfSizeAlso": reducePdfSizeAlso,
                "commonRunId": commonRunId,
                "runId": runId,
            }

            console.log(`(${i + 1}/${_srcFolders.length})runPthonPdfExtractionInLoop payload: ${JSON.stringify(_payload)}`);

            try {
                const logEntry = new PdfPageExtractionPerItemHistory({
                    _srcFolder: input_folder,
                    _destRootFolder: destRootFolder,
                    "firstNPages": nFirstPages,
                    "lastNPages": nLastPages,
                    "reducePdfSizeAlso": reducePdfSizeAlso,
                    "commonRunId": commonRunId,
                    "runId": runId
                });
                await logEntry.save();
                console.log(`Saved PdfPageExtractionHistory for commonRunId: ${commonRunId} and runId: ${runId}`);
            } catch (logErr) {
                console.error('Error saving PdfPageExtractionHistory:', logErr);
                continue;
            }

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
                // Update per-item history with detailed result
                try {
                    const errorsCount = (result as any)?.data?.errors ?? 0;
                    await PdfPageExtractionPerItemHistory.updateOne(
                        { runId },
                        {
                            $set: {
                                logs: (result as any)?.data,
                                success: errorsCount === 0,
                                errorMsg: errorsCount > 0 ? result.message : '',
                            }
                        }
                    );
                } catch (updateErr) {
                    console.error('Error updating PdfPageExtractionPerItemHistory with result:', updateErr);
                }
            }
            else {
                combinedResults.push({
                    err: _resp?.message,
                    msg: `Exception ${input_folder}`,
                    success: false,
                    _srcFolder: input_folder,
                    destRoot: destRootFolder,
                });
                try {
                    await PdfPageExtractionPerItemHistory.updateOne(
                        { runId },
                        {
                            $set: {
                                logs: `Exception ${input_folder}`,
                                success: false,
                                errorMsg: _resp?.message,
                            }
                        }
                    );
                } catch (updateErr) {
                    console.error('Error updating PdfPageExtractionPerItemHistory with result:', updateErr);
                }
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
    // update PdfPageExtractionHistory
    const successCount = combinedResults.filter((result) => result.success).length;
    try {
        await PdfPageExtractionHistory.updateOne(
            { commonRunId },
            {
                $set: {
                    success: successCount === srcFolderCount,
                    status: `${successCount}/${srcFolderCount}/${srcFolderCount - successCount}`,
                }
            }
        );
    } catch (updateErr) {
        console.error('Error updating PdfPageExtractionHistory with result:', updateErr);
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

export const runHeaderFooterRemovalInLoop = async (_srcFolders: string[],
    commonDest: string,
    commonRunId: string) => {
    const combinedResults = [];
    const srcFolderCount = _srcFolders.length;

    try {
        const logEntry = new AcrobatHeaderFooterRemovalHistory({
            "_srcFolders": _srcFolders,
            "commonDest": commonDest,
            "srcFolderCount": srcFolderCount,
            "commonRunId": commonRunId,
            "success": false,
        });
        await logEntry.save();
        console.log(`Saved AcrobatHeaderFooterRemovalHistory for commonRunId: ${commonRunId} `);
    } catch (logErr) {
        console.error('Error saving AcrobatHeaderFooterRemovalHistory:', logErr);
    }

    for (let srcFolder of _srcFolders) {
        const runId = randomUUID();
        try {
            console.log(`runHeaderFooterRemovalInLoop srcFolder ${srcFolder} `);
            await createFolderIfNotExistsAsync(commonDest);
            console.log(`Folder created: ${commonDest}`);

            try {
                const logEntry = new AcrobatHeaderFooterRemovalPerItemHistory({
                    _srcFolder: srcFolder,
                    _destFolder: commonDest,
                    "commonRunId": commonRunId,
                    "runId": runId
                });
                await logEntry.save();
            } catch (logErr) {
                console.error('Error saving AcrobatHeaderFooterRemovalPerItemHistory:', logErr);
            }

            console.log(`runHeaderFooterRemovalInLoop srcFolder ${srcFolder} commonDest ${commonDest}`);
            const _resp = await executePythonPostCall({
                "input_folder": srcFolder,
                "output_folder": commonDest,
                "commonRunId": commonRunId,
                "runId": runId,
            }, 'bulkRemoveAcrobatHeaderFooter');

            console.log(`runHeaderFooterRemovalInLoop response
                 srcFolder ${srcFolder} commonDest ${commonDest} 
                 _resp ${JSON.stringify(_resp)}`);

            const result = {
                srcFolder,
                commonDest,
                success: _resp.status,
                ..._resp,
            }
            console.log('result', result);
            combinedResults.push(result);

            // Update per-item history
            try {
                const pythonDetails = (_resp.data as any)?.processing_details || [];
                const mappedResults = pythonDetails.map((pd: any) => ({
                    srcPdf: path.join(srcFolder, pd.file),
                    destPdf: path.join(commonDest, pd.file),
                    success: pd.status === 'success',
                    errorMsg: pd.error || '',
                }));

                await AcrobatHeaderFooterRemovalPerItemHistory.updateOne(
                    { runId },
                    {
                        $set: {
                            results: mappedResults,
                            logs: _resp.data || _resp.message,
                            success: _resp.status,
                            errorMsg: _resp.status ? '' : _resp.message,
                        }
                    }
                );
            } catch (updateErr) {
                console.error('Error updating AcrobatHeaderFooterRemovalPerItemHistory:', updateErr);
            }
        }
        catch (err) {
            console.log('Error runHeaderFooterRemovalInLoop:', err);
            combinedResults.push({
                err,
                msg: `Exception ${srcFolder}`,
                success: false,
                _srcFolder: srcFolder,
                destRoot: commonDest,
            });
            try {
                await AcrobatHeaderFooterRemovalPerItemHistory.updateOne(
                    { runId },
                    {
                        $set: {
                            success: false,
                            errorMsg: String(err),
                        }
                    }
                );
            } catch (updateErr) {
                console.error('Error updating AcrobatHeaderFooterRemovalPerItemHistory on exception:', updateErr);
            }
        }
    }

    // update overall history
    const successCount = combinedResults.filter((result) => result.success).length;
    try {
        await AcrobatHeaderFooterRemovalHistory.updateOne(
            { commonRunId },
            {
                $set: {
                    success: successCount === srcFolderCount,
                    status: `${successCount}/${srcFolderCount}/${srcFolderCount - successCount}`,
                }
            }
        );
    } catch (updateErr) {
        console.error('Error updating AcrobatHeaderFooterRemovalHistory summary:', updateErr);
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

export type PythonPostCallResult<TData = ExtractionOperationData> = {
    status: boolean;
    message: string;
    data?: TData;
    error?: unknown;
};

export interface PythonPostOptions {
    timeoutMs?: number;
    skipPreflight?: boolean;
}

export const executePythonPostCall = async <TData = ExtractionOperationData>(
    body: any,
    resource: string,
    opts: PythonPostOptions = { timeoutMs: 60 * 60 * 1000, skipPreflight: true }
): Promise<PythonPostCallResult<TData>> => {
    try {
        if (!opts?.skipPreflight) {
            const serverStatus = await checkPythonServer();
            if (!serverStatus.status) {
                return serverStatus;
            }
        }
        const _res = await pythonPostCallInternal<TData>(body, resource, opts);
        return _res;
    } catch (error) {
        console.log('Error executePythonPostCall:', error);
        return {
            status: false,
            message: "Python Server could be down"
        };
    }
};

export const pythonPostCallInternal = async <TData = ExtractionOperationData>(body: any, resource: string, opts?: PythonPostOptions): Promise<PythonPostCallResult<TData>> => {
    console.log(`python call ${resource} ${JSON.stringify(body, null, 2)}`)
    const controller = typeof AbortController !== 'undefined' && opts?.timeoutMs ? new AbortController() : undefined;
    const timer = controller && opts?.timeoutMs ? setTimeout(() => controller.abort(), opts.timeoutMs) : undefined;
    try {
        const response = await fetch(`${PYTHON_SERVER_URL}/${resource}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            ...(controller ? { signal: controller.signal } : {}),
        });
        if (response?.ok) {
            const data = await response.json() as TData;
            console.log(`data ${JSON.stringify(data, null, 2)}`)
            return {
                status: true,
                message: 'Success',
                data
            };
        }
        try {
            const errorData = await response.json();
            console.error(`Error ${response.status} from ${resource}:`, JSON.stringify(errorData, null, 2));
            return {
                status: false,
                message: `Error ${response.status} from ${resource}: ${JSON.stringify(errorData)}`,
                error: errorData
            };
        } catch (e) {
            const text = await response.text().catch(() => '');
            console.error(`Error ${response.status} from ${resource}: ${text}`);
            return {
                status: false,
                message: `Error ${response.status} from ${resource}: ${text}`,
                error: text
            };
        }
    } catch (error) {
        console.error('Network error in pythonPostCallInternal:', error);
        return {
            status: false,
            message: `Network error calling ${resource}: ${String((error as any)?.message || error)}`,
            error
        };
    } finally {
        if (timer) clearTimeout(timer);
    }
}   
