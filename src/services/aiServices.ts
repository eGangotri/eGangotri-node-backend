import { AI_DELAY_BETWEEN_CALLS_MS } from "../cliBased/ai/renaming-workflow/constants";
import { renameDriveFileByLink } from "../cliBased/ai/renaming-workflow/renameGDriveCoverPages";
import { ALL_TYPE } from "../cliBased/googleapi/_utils/constants";
import { MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE } from "../cliBased/googleapi/GoogleDriveApiReadAndDownload";
import { getGDriveContentsAsJson } from "../cliBased/googleapi/GoogleDriveApiReadAndExport";
import { sleep } from "openai/core";

export const renameCPSByLink = async (googleDriveLink: string,
    ignoreFolder: string
):Promise<{
    response: any[],
    successCount: number,
    failureCount: number,
    totalFileCount: number,
    error?: string
}> => {
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
            error: `Total files (${googleDriveData.length}) exceeds maximum limit of ${MAX_GOOGLE_DRIVE_ITEM_PROCESSABLE}. Please do smaller batches.`
        }
    }

    totalFileCount += googleDriveData.length;
    const response = []
    let failureCount = 0;
    let successCount = 0;
    for (let i = 0; i < googleDriveData.length; i++) {
        const googleDriveDataItem = googleDriveData[i];
        try {
            if (i > 0) {
                console.log(`Waiting ${AI_DELAY_BETWEEN_CALLS_MS / 1000}s for next batch before next API call to avoid rate limits...`);
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
            continue;
        }
    }

    const results = {
        response,
        successCount,
        failureCount,
        totalFileCount,
    };
    console.log(`response: ${JSON.stringify(results)}`)

    return results
}

