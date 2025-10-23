import { GDRIVE_CP_EXTRACTED_METADATA_RES } from "../routes/utils";
import { AI_DELAY_BETWEEN_CALLS_MS } from "../cliBased/ai/renaming-workflow/constants";
import { renameDriveFileByLink } from "../cliBased/ai/renaming-workflow/renameGDriveCoverPages";
import { ALL_TYPE } from "../cliBased/googleapi/_utils/constants";
import { MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from "../cliBased/googleapi/GoogleDriveApiReadAndDownload";
import { getGDriveContentsAsJson } from "../cliBased/googleapi/GoogleDriveApiReadAndExport";
import { sleep } from "openai/core";
import { randomUUID } from "crypto";
import { recordGDriveCpRenameHistory } from "./gdriveCpRenameHistoryService";

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
        GDRIVE_CP_EXTRACTED_METADATA_RES.processedCount = 0;

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
                await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: "Same as old name", googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName });
                continue;
            }
            else if (renameResult.newName?.trim().length === 0) {
                console.log(`No New Name for ${renameResult.oldName}`);
                failureCount++;
                await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: "No New Name", googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName });
                continue;
            }
            response.push(renameResult);
            successCount++;
            await recordGDriveCpRenameHistory({ commonRunId, runId, success: true, googleDriveLink: googleDriveDataItem.googleDriveLink, fileId: renameResult.fileId, oldName: renameResult.oldName, newName: renameResult.newName });
            
        }
        catch (err) {
            console.log(`Error renaming file ${googleDriveDataItem.googleDriveLink}: ${err}`);
            failureCount++;
            await recordGDriveCpRenameHistory({ commonRunId, runId, success: false, error: String(err), googleDriveLink: googleDriveDataItem.googleDriveLink });
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


