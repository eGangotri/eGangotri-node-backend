import { LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC, getFolderInSrcRootForProfile } from "../../cliBased/utils";
import { extractGoogleDriveId } from "../googleapi/_utils/GoogleDriveUtil";
import fs from 'fs';
import { DOWNLOAD_COMPLETED_COUNT, incrementDownloadComplete, incrementDownloadFailed } from "./utils";

const { DownloaderHelper } = require('node-downloader-helper');

const DEFAULT_DUMP_FOLDER = "D:\\_playground\\_dwnldPlayground";

export const getPdfDownloadLink = (driveId: string) => {
    return `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`
}

export const downloadPdfFromGoogleDrive = async (driveLinkOrFolderId: string,
    pdfDumpFolder: string,
    fileName: string = "",
    dataLength:number = 0) => {
    console.log(`downloadPdfFromGoogleDrive ${driveLinkOrFolderId}`)
    const driveId = extractGoogleDriveId(driveLinkOrFolderId)
    const _pdfDlUrl = getPdfDownloadLink(driveId)
    console.log(`downloading ${_pdfDlUrl} to ${pdfDumpFolder}`)

    const dl = new DownloaderHelper(_pdfDlUrl, pdfDumpFolder);//
    let _result = {};
    try {
        await new Promise((resolve, reject) => {
            dl.on('end', () => {
                const index = `(${DOWNLOAD_COMPLETED_COUNT+1}${dataLength>0?"/"+dataLength:""})`;
                console.log(`${index}. Downloaded ${fileName}`);
                incrementDownloadComplete();
                _result = {
                    "status": `${driveId} downloaded ${fileName} to ${pdfDumpFolder}`,
                    success: true
                };
                resolve(_result);
            });

            dl.on('error', (err: Error) => {
                incrementDownloadFailed();
                console.log(`Download Failed ${fileName}`, err.message);
                reject(_result = {
                    success: false,
                    "error": `${driveId} failed download of ${fileName} to ${pdfDumpFolder} with ${err.message}`
                });
            });

            dl.start();
        });
    } catch (err) {
        console.error(err);
        incrementDownloadFailed();
        _result = {
            success: false,
            "error": `${driveId} failed download try/catch for ${fileName} to ${pdfDumpFolder} with ${err.message}`
        };
    }

    return _result;
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

// downloadPdfFromGoogleDrive("17OsRNBJC4OSPZ8EAqtxIYu_mWQkpSP96");
// downloadPdfFromGoogleDrive("1M0Xk75dlVz6GHaXaKEsp3uwr-RBG0-eJ");

//getFileDetailsFromGoogleUrl("1M0Xk75dlVz6GHaXaKEsp3uwr-RBG0-eJ")

downloadPdfFromGoogleDrive("1zXosWPqnbz8FpDO2p3nt1S58AmqKJl1J", "D:\\_playground\\_ganeshPlayGround");
// downloadPdfFromGoogleDrive(
//     "https://drive.google.com/drive/folders/1bBScm1NxfJQD16Ry-oG7XsSbTYFi0AMY?usp=share_link")
//yarn run downloadPdf