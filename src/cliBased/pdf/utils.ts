import axios from 'axios';
import fs from 'fs';
import { getFilzeSize, sizeInfo } from "../../mirror/FrontEndBackendCommonCode";
import { extractGoogleDriveId } from "../../mirror/GoogleDriveUtilsCommonCode";

export let DOWNLOAD_COMPLETED_COUNT = 0;
export let DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT = 0;
export let DOWNLOAD_FAILED_COUNT = 0;

export const incrementDownloadComplete = () => {
    DOWNLOAD_COMPLETED_COUNT++
}
export const incrementDownloadInError = () => {
    DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT++
}

export const incrementDownloadFailed = () => {
    DOWNLOAD_FAILED_COUNT++
}
export const resetDownloadCounters = () => {
    DOWNLOAD_COMPLETED_COUNT = 0;
    DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT = 0;
    DOWNLOAD_FAILED_COUNT = 0;
}


export const checkFileSizeConsistency = (pdfDumpFolder: string, fileName: string, fileSizeRaw: string) => {
    if (fileSizeRaw !== "0") {
        const fileSizeOfDwnldFile = getFilzeSize(`${pdfDumpFolder}\\${fileName}`);
        const fileSizeRawAsInt = parseInt(fileSizeRaw);
        if (fileSizeOfDwnldFile != fileSizeRawAsInt) {
            console.log(`Downloaded file size for (${fileName}) ${fileSizeOfDwnldFile} does not match with expected size ${fileSizeRaw}`);
            incrementDownloadFailed();
            return {
                status: `Downloaded ${fileName} to ${pdfDumpFolder}
                but FileSize (${sizeInfo(fileSizeOfDwnldFile)} !== ${sizeInfo(fileSizeRawAsInt)}) dont match`,
                success: false
            };
        }
    }
    return { success: true }
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


export const downloadPdfFromUrlSlow = async (
    pdfDumpFolder: string,
    downloadUrl: string,
    fileName: string,
    dataLength: number,
    fileSizeRaw = "0") => {

    let _result: { success?: boolean, status?: string, error?: string } = {};
    try {

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(`${pdfDumpFolder}\\${fileName}`);
        console.log(`downloadPdfFromUrlSlow - ${fileName}`)
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', () => {
                _result = checkFileSizeConsistency(pdfDumpFolder, fileName, fileSizeRaw);
                if (_result?.success) {
                    const index = `(${DOWNLOAD_COMPLETED_COUNT + 1}${dataLength > 0 ? "/" + dataLength : ""})`;
                    console.log(`${index}. Downloaded(slow): ${fileName}`);
                    incrementDownloadComplete();
                    _result = {
                        "status": `Downloaded ${fileName} to ${pdfDumpFolder}`,
                        success: true
                    };
                }
                resolve(_result);
            });
            writer.on('error', (err: Error) => {
                incrementDownloadInError();
                console.log(`Download Failed! ${fileName}` + JSON.stringify(err.message));
                reject(_result = {
                    success: false,
                    "error": `Failed download of ${fileName} to ${pdfDumpFolder} with ${err.message}`
                })
            });
        });
    }
    catch (err) {
        console.error(err);
        incrementDownloadInError();
        _result = {
            success: false,
            "error": `Failed download try/catch for ${fileName} to ${pdfDumpFolder} with ${err.message}`
        };
    }

    return _result;
};