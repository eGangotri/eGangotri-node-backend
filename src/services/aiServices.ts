import { AI_DELAY_BETWEEN_CALLS_MS } from "../cliBased/ai/renaming-workflow/constants";
import { renameDriveFileByLink } from "../cliBased/ai/renaming-workflow/renameGDriveCoverPages";
import { ALL_TYPE } from "../cliBased/googleapi/_utils/constants";
import { MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from "../cliBased/googleapi/GoogleDriveApiReadAndDownload";
import { getGDriveContentsAsJson } from "../cliBased/googleapi/GoogleDriveApiReadAndExport";
import { sleep } from "openai/core";

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
    ignoreFolder: string
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

    totalFileCount += googleDriveData.length;
    const response = []
    let failureCount = 0;
    let successCount = 0;
    const errors = []
    for (let i = 0; i < googleDriveData.length; i++) {
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
                continue;
            }
            response.push(renameResult);
            successCount++;
        }
        catch (err) {
            console.log(`Error renaming file ${googleDriveDataItem.googleDriveLink}: ${err}`);
            failureCount++;
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
}


