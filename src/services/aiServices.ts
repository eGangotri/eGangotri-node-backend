import path from "path";
import * as fs from "fs";
import { sleep } from "openai/core";
import { randomUUID } from "crypto";
import { GDRIVE_CP_EXTRACTED_METADATA_RES } from "../routes/utils";
import { AI_DELAY_BETWEEN_CALLS_MS } from "../cliBased/ai/renaming-workflow/constants";
import { renameDriveFileByLink } from "../cliBased/ai/renaming-workflow/renameGDriveCoverPages";
import { ALL_TYPE } from "../cliBased/googleapi/_utils/constants";
import { MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from "../cliBased/googleapi/GoogleDriveApiReadAndDownload";
import { getGDriveContentsAsJson } from "../cliBased/googleapi/GoogleDriveApiReadAndExport";
import { recordGDriveCpRenameHistory } from "./gdriveCpRenameHistoryService";
import { PdfTitleRenamingViaAITracker, IPdfTitleRenamingViaAITracker } from "../models/pdfTitleRenamingTrackerViaAI";
import { PdfTitleAndFileRenamingTrackerViaAI } from "../models/pdfTitleAndFileRenamingTrackerViaAI";
import { processWithGoogleAI } from "../cliBased/ai/renaming-workflow/googleAiService";
import { formatFilename } from "../cliBased/ai/renaming-workflow/utils";
import { _renameFileByAbsPath } from "./fileUtilsService";

export type RenameCPSByLinkResponse = {
    status?: string,
    message?: string,
    response: any[],
    successCount: number,
    failureCount: number,
    totalFileCount: number,
    errors?: string[]
}

export const renameCPSByLink = async (googleDriveLink: string,
    ignoreFolder: string,
    commonRunId: string
): Promise<RenameCPSByLinkResponse> => {
    const googleDriveData = await getGDriveContentsAsJson(googleDriveLink,
        "", ignoreFolder, ALL_TYPE, commonRunId);
    let totalFileCount = 0;

    if (googleDriveData.length > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE) {
        console.log(`:reanmeCPs:googleDriveData.length > MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE: ${googleDriveData.length} > ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}`)
        return {
            response: [],
            successCount: 0,
            failureCount: 0,
            totalFileCount: 0,
            errors: [`Total files (${googleDriveData.length}) exceeds maximum limit of ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}. Please do smaller batches.`]
        }
    }
    const runId = randomUUID();

    totalFileCount += googleDriveData.length;
    const response = []
    let failureCount = 0;
    let successCount = 0;
    const errors = []
    for (let i = 0; i < googleDriveData.length; i++) {
        GDRIVE_CP_EXTRACTED_METADATA_RES.totalCount = googleDriveData.length;
        GDRIVE_CP_EXTRACTED_METADATA_RES.processedCount = i;

        const googleDriveDataItem = googleDriveData[i];
        try {
            if (i > 0) {
                //console.log(`Waiting ${AI_DELAY_BETWEEN_CALLS_MS / 1000}s for next batch before next API call to avoid rate limits...`);
                await sleep(AI_DELAY_BETWEEN_CALLS_MS);
            }
            const renameResult = await renameDriveFileByLink(googleDriveDataItem.googleDriveLink);
            if (renameResult.newName === renameResult.oldName) {
                console.log(`File ${renameResult.oldName} not renamed as it is same as old name`);
                failureCount++;
                await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: "Same as old name", googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName, mainGDriveLink: googleDriveLink });
                continue;
            }
            else if (renameResult.newName?.trim().length === 0) {
                console.log(`No New Name for ${renameResult.oldName}`);
                failureCount++;
                await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: "No New Name", googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName, mainGDriveLink: googleDriveLink });
                continue;
            }
            response.push(renameResult);
            successCount++;
            await recordGDriveCpRenameHistory({ commonRunId, runId, success: true, googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName, newName: renameResult.newName, mainGDriveLink: googleDriveLink });

        }
        catch (err) {
            console.log(`Error renaming file ${googleDriveDataItem.googleDriveLink}: ${err}`);
            failureCount++;
            await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: String(err), googleDriveLink: googleDriveDataItem.googleDriveLink, mainGDriveLink: googleDriveLink });
            errors.push(`Error renaming file ${googleDriveDataItem.googleDriveLink}: ${err}`);
            continue;
        }
    }

    const results = {
        "status": "success",
        "message": `${successCount} files renamed successfully for ${googleDriveLink
            }, ${failureCount} files failed to rename`,
        // Expose counts at the top level so aggregation below works
        successCount,
        failureCount,
        totalFileCount,
        errors,
        response,
    }
    return results;
}


export const renameOriginalItemsBasedOnMetadata = async (pdfTitleRenamedItems: IPdfTitleRenamingViaAITracker[], keepPrefix: boolean = false) => {
    const errors = []
    const results: boolean[] = []
    for (let index = 0; index < pdfTitleRenamedItems.length; index++) {
        const item = pdfTitleRenamedItems[index]
        try {
            const dir = path.dirname(item.originalFilePath);
            const ext = path.extname(item.originalFilePath);
            const newNameWithoutExt = String(item.extractedMetadata);
            const originalFileName = path.basename(item.originalFilePath, ext);

            let baseName = String(newNameWithoutExt);

            if (keepPrefix) {
                baseName = `${originalFileName} - ${baseName}`;
            }

            baseName = formatFilename(baseName);
            if (newNameWithoutExt?.trim().length === 0) {
                console.log(`No New Name for ${item.originalFilePath}`);
                errors.push({
                    filePath: item.originalFilePath,
                    error: `No New Name for ${item.originalFilePath}`
                })
                results.push(false);
                continue;
            }
            // Precompute a non-colliding target path
            let counter = 0;
            const targetBaseNameProper = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName.slice(0, -ext.length) : baseName;
            const baseTarget = path.join(dir, `${targetBaseNameProper}${ext}`).trim();
            let targetPath = baseTarget;
            while (fs.existsSync(targetPath) && counter < 10) {
                counter += 1;
                targetPath = path.join(dir, `${targetBaseNameProper}_${counter}${ext}`).trim();
            }
            console.log(`Renaming ${index + 1}/${pdfTitleRenamedItems.length}: ${item.originalFilePath} to ${targetPath}`);
            try {
                await fs.promises.rename(item.originalFilePath, targetPath);
                await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                    $set: {
                        newFilePath: targetPath,
                        msg: `Renamed from original location to ${targetPath}`
                    }
                });
                results.push(true);
            } catch (e: any) {
                console.error(`Failed to process ${item.originalFilePath}: ${e?.message || String(e)}`);
                errors.push({
                    filePath: item.originalFilePath,
                    error: e?.message || String(e)
                })
                results.push(false);
            }
        } catch (err: any) {
            console.error(`Failed to process ${item.originalFilePath}: ${err?.message || String(err)}`);
            errors.push({
                filePath: item.originalFilePath,
                error: err?.message || String(err)
            })
            results.push(false);
        }
    }
    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;
    return {
        successCount,
        failureCount,
        errors
    }
}

export const retryAiRenamerByRunId = async (runId: string) => {
    if (!runId) {
        throw new Error("runId is required");
    }

    const failedFilter: any = {
        runId,
        $or: [
            { error: { $exists: true, $nin: [null, ""] } },
            { extractedMetadata: { $in: [null, "", "NIL"] } },
        ],
    };

    const failedItems: IPdfTitleRenamingViaAITracker[] = await PdfTitleRenamingViaAITracker.find(failedFilter).sort({ createdAt: 1 });

    if (!failedItems || failedItems.length === 0) {
        return { status: "success", message: "No failed items found for this runId", runId, retried: 0, successes: 0, failures: 0, details: [] as Array<{ originalFilePath: string; newFilePath?: string; error?: string }> };
    }

    let successes = 0;
    let failures = 0;
    const details: Array<{ originalFilePath: string; newFilePath?: string; error?: string }> = [];
    console.log(`Failed Items Count: ${failedItems.length} ${JSON.stringify(failedItems)}`);
    for (const item of failedItems) {
        try {
            const result = await processWithGoogleAI(item.reducedFilePath);
            if (result?.extractedMetadata && !result?.error) {
                const ext = path.extname(item.originalFilePath);
                const base = formatFilename(result.extractedMetadata);
                const targetBaseNameProper = base.toLowerCase().endsWith(ext.toLowerCase()) ? base.slice(0, -ext.length) : base;
                const formattedFileName = `${targetBaseNameProper}${ext}`;
                const targetDir = item.outputFolder && item.outputFolder.trim().length > 0
                    ? item.outputFolder
                    : path.dirname(item.originalFilePath);

                const newFilePath = path.join(targetDir, formattedFileName);
                try {
                    if (formattedFileName?.trim().length > 0) {
                        console.log(`Renaming ${item.originalFilePath} to ${newFilePath} `)

                        if (targetDir !== path.dirname(item.originalFilePath) && !fs.existsSync(targetDir)) {
                            fs.mkdirSync(targetDir, { recursive: true });
                        }
                        fs.copyFileSync(item.originalFilePath, newFilePath);
                        await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                            $set: {
                                extractedMetadata: result.extractedMetadata,
                                newFilePath,
                                msg: `Renamed ${item.originalFilePath} to ${newFilePath}`,
                            }
                        });
                    } else {
                        console.log(`newFilePath is empty for ${item.originalFilePath}`);
                        throw new Error("newFilePath is empty");
                    }
                } catch (copyErr: any) {
                    console.log(`File copy failed: ${copyErr?.message || copyErr} `);
                    await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                        $set: {
                            extractedMetadata: result.extractedMetadata,
                            error: `File copy failed: ${copyErr?.message || copyErr} `,
                        }
                    });
                    failures++;
                    details.push({ originalFilePath: item.originalFilePath, error: `File copy failed: ${copyErr?.message || copyErr} ` });
                    continue;
                }

                await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                    $set: {
                        extractedMetadata: result.extractedMetadata,
                        error: undefined,
                        newFilePath,
                    }
                });
                successes++;
                details.push({ originalFilePath: item.originalFilePath, newFilePath });
            } else {
                await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                    $set: {
                        extractedMetadata: result?.extractedMetadata || '',
                        error: result?.error || 'Unknown error after retry',
                    }
                });
                failures++;
                details.push({ originalFilePath: item.originalFilePath, error: result?.error || 'Unknown error after retry' });
            }
        } catch (err: any) {
            await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                $set: {
                    error: err?.message || String(err),
                }
            });
            failures++;
            details.push({ originalFilePath: item.originalFilePath, error: err?.message || String(err) });
        }
    }

    try {
        const allForRun = await PdfTitleRenamingViaAITracker.find({ runId });
        const processedCount = allForRun.length;
        const successCount = allForRun.filter(d => (d as any).extractedMetadata && !(d as any).error).length;
        const failedCount = processedCount - successCount;

        await PdfTitleAndFileRenamingTrackerViaAI.updateOne({ runId }, {
            $set: {
                processedCount,
                successCount,
                failedCount,
                success: failedCount === 0,
            }
        });
    } catch (aggErr) {
        console.error('Failed to update AI summary tracker after retry:', aggErr);
    }

    return {
        status: 'success',
        runId,
        retried: failedItems.length,
        successes,
        failures,
        details,
    };
}

export const reverseMetadataFromOriginalFiles = async (pdfTitleRenamedItems: IPdfTitleRenamingViaAITracker[]) => {
    const errors = []
    const results: boolean[] = []
    for (let index = 0; index < pdfTitleRenamedItems.length; index++) {
        const item = pdfTitleRenamedItems[index]
        try {
            // Priority 1: Check if newFilePath exists and is correct
            let currentPath = item.newFilePath;

            if (!currentPath || !fs.existsSync(currentPath)) {
                // Priority 2: If original path already exists, we might be done
                if (fs.existsSync(item.originalFilePath)) {
                    console.log(`File already at original path: ${item.originalFilePath}`);
                    await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                        $set: {
                            newFilePath: undefined,
                            applyButtonClicked: false,
                            msg: "File was already at original path"
                        }
                    });
                    results.push(true);
                    continue;
                }

                // Priority 3: Try to guess the path if newFilePath was never stored
                const dir = path.dirname(item.originalFilePath);
                const ext = path.extname(item.originalFilePath);
                const guessedPath = path.join(dir, `${item.extractedMetadata}${ext}`).trim();

                if (fs.existsSync(guessedPath)) {
                    currentPath = guessedPath;
                }
            }

            if (!currentPath || !fs.existsSync(currentPath)) {
                console.warn(`Could not find renamed file for ${item.originalFilePath}`);
                errors.push({
                    filePath: item.originalFilePath,
                    error: "Could not find current file to reverse"
                });
                results.push(false);
                continue;
            }

            console.log(`Reversing ${index + 1}/${pdfTitleRenamedItems.length}: ${currentPath} back to ${item.originalFilePath}`);
            try {
                await fs.promises.rename(currentPath, item.originalFilePath);
                await PdfTitleRenamingViaAITracker.updateOne({ _id: (item as any)._id }, {
                    $set: {
                        newFilePath: undefined,
                        applyButtonClicked: false,
                        msg: `Reversed rename: ${currentPath} -> ${item.originalFilePath}`
                    }
                });
                results.push(true);
            } catch (e: any) {
                console.error(`Failed to reverse rename for ${currentPath}: ${e?.message || String(e)}`);
                errors.push({
                    filePath: currentPath,
                    error: e?.message || String(e)
                });
                results.push(false);
            }
        } catch (err: any) {
            console.error(`Unexpected error in reversal for ${item.originalFilePath}: ${err?.message || String(err)}`);
            errors.push({
                filePath: item.originalFilePath,
                error: err?.message || String(err)
            });
            results.push(false);
        }
    }
    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;
    return {
        successCount,
        failureCount,
        errors
    }
}
