import { getFileSizeAsync, sizeInfo } from "../../mirror/FrontEndBackendCommonCode";
import { extractGoogleDriveId } from "../../mirror/GoogleDriveUtilsCommonCode";

let downloadCounters = {};

export const DOWNLOAD_COMPLETED_COUNT = (requestId: string) => {
    return getDownloadCounters(requestId)?.completed || 0;
}

export const DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT = (requestId: string) => {
    return getDownloadCounters(requestId)?.inError || 0;
}

export const DOWNLOAD_FAILED_COUNT = (requestId: string) => {
    return getDownloadCounters(requestId)?.failed || 0;
}


export function incrementDownloadCompleted(requestId: string) {
    getDownloadCounters(requestId).completed++;
}

export function incrementDownloadInError(requestId: string) {
    getDownloadCounters(requestId).inError++;
}

export function incrementDownloadFailed(requestId: string) {
    getDownloadCounters(requestId).failed++;
}

export function getDownloadCounters(requestId: string) {
    if (!downloadCounters[requestId]) {
        downloadCounters[requestId] = {
            completed: 0,
            inError: 0,
            failed: 0
        };
        return downloadCounters[requestId];
    }
    return downloadCounters[requestId];
}

export const checkFileSizeConsistency = async (pdfDumpFolder: string,
    fileName: string, fileSizeRaw: string, downloadCounterController = ""
) => {
    if (fileSizeRaw !== "0") {
        const fileSizeOfDwnldFile = await getFileSizeAsync(`${pdfDumpFolder}\\${fileName}`);
        const fileSizeRawAsInt = parseInt(fileSizeRaw);
        if (fileSizeOfDwnldFile != fileSizeRawAsInt) {
            console.log(`Downloaded file size for (${fileName}) ${fileSizeOfDwnldFile} does not match with expected size ${fileSizeRaw}`);
            incrementDownloadFailed(downloadCounterController);
            const _resp = {
                status: `Downloaded ${fileName} to ${pdfDumpFolder}
                but FileSize (${sizeInfo(fileSizeOfDwnldFile)} !== ${sizeInfo(fileSizeRawAsInt)}) dont match`,
                success: false
            };
            console.log(`checkFileSizeConsistency: ${JSON.stringify(_resp)}`);
            return _resp;
        }
    }
    const _resp = { success: true, status: `Downloaded ${fileName} to ${pdfDumpFolder}` };
    console.log(`checkFileSizeConsistency: ${JSON.stringify(_resp)}`);
    return _resp;
}




//{"scanResult":"OK","disposition":"SCAN_CLEAN","fileName":"Anang Rito Dwanda.pdf","sizeBytes":827924,"downloadUrl":"https:\/\/drive.usercontent.google.com\/download?id=17OsRNBJC4OSPZ8EAqtxIYu_mWQkpSP96&export=download&authuser=0&confirm=t&uuid=3e023e6b-413f-43f8-8c0e-4feccac88c33&at=APZUnTWJITyGBCb64CIGROZM-l95:1692979966504"}
//{"scanResult":"WARNING","disposition":"TOO_LARGE","fileName":"file 7.pdf","sizeBytes":203470209,"downloadUrl":"https:\/\/drive.usercontent.google.com\/download?id=1M0Xk75dlVz6GHaXaKEsp3uwr-RBG0-eJ&export=download&authuser=0&confirm=t&uuid=30a6908a-9c30-444b-8f7b-c16177c13ff3&at=APZUnTWvp6RZVPKbr8DCrOp1lR-m:1692980267429"}
const getFileDetailsFromGoogleUrl = async (driveLinkOrFolderId: string) => {
    const driveId = extractGoogleDriveId(driveLinkOrFolderId)
    const postUrl = `https://drive.usercontent.google.com/uc?id=${driveId}&authuser=0&export=download`
    const response: Response = await fetch(postUrl, {
        method: "POST",
    })

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    console.log(`HTTP error! Status: ${response.status}`);
}
