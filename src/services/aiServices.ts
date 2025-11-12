import { GDRIVE_CP_EXTRACTED_METADATA_RES } from "../routes/utils";
import { AI_DELAY_BETWEEN_CALLS_MS } from "../cliBased/ai/renaming-workflow/constants";
import { renameDriveFileByLink } from "../cliBased/ai/renaming-workflow/renameGDriveCoverPages";
import { ALL_TYPE } from "../cliBased/googleapi/_utils/constants";
import { MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from "../cliBased/googleapi/GoogleDriveApiReadAndDownload";
import { getGDriveContentsAsJson } from "../cliBased/googleapi/GoogleDriveApiReadAndExport";
import { sleep } from "openai/core";
import { randomUUID } from "crypto";
import { recordGDriveCpRenameHistory } from "./gdriveCpRenameHistoryService";
import { IPdfTitleRenamingViaAITracker } from "models/pdfTitleRenamingTrackerViaAI";
import path from "path";
import * as fs from "fs";
import { PdfTitleRenamingViaAITracker } from "models/pdfTitleRenamingTrackerViaAI";
import { PdfTitleAndFileRenamingTrackerViaAI } from "models/pdfTitleAndFileRenamingTrackerViaAI";
import { processWithGoogleAI } from "../cliBased/ai/renaming-workflow/googleAiService";
import { formatFilename } from "../cliBased/ai/renaming-workflow/utils";

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
        "", ignoreFolder, ALL_TYPE);
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


export const renameOriginalItemsBasedOnMetadata = async (pdfTitleRenamedItems: IPdfTitleRenamingViaAITracker[]) => {
    const errors = []
    const results = await Promise.all(
        pdfTitleRenamedItems.map(async (item, index) => {
            try {
                const dir = path.dirname(item.originalFilePath);
                const ext = path.extname(item.originalFilePath);
                const newName = String((item.extractedMetadata + ext) || item.fileName);
                const targetPath = path.join(dir, newName).trim();
                console.log(`Renaming ${index + 1}/${pdfTitleRenamedItems.length}: ${item.originalFilePath} to ${targetPath}`);
                await fs.promises.rename(item.originalFilePath, targetPath);
                return true;
            } catch (err: any) {
                console.error(`Failed to process ${item.originalFilePath}: ${err?.message || String(err)}`);
                errors.push({
                    filePath: item.originalFilePath,
                    error: err?.message || String(err)
                })
                return false;
            }
        })
    );
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
                const formattedFileName = formatFilename(result.extractedMetadata);
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
