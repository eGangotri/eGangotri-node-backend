import { extractGoogleDriveId } from "../googleapi/_utils/GoogleDriveUtil";
const { DownloaderHelper } = require('node-downloader-helper');

const dumpFolder = "C:\\Users\\chetan\\Documents\\_personal";

const downloadPdfFromGoogleDrive = (driveLinkOrFolderId: string) => {
    const driveId = extractGoogleDriveId(driveLinkOrFolderId)
    const _pdfDlUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0&confirm=t`
    const dl = new DownloaderHelper(_pdfDlUrl, dumpFolder);//

    dl.on('end', () => console.log('Download Completed'));
    dl.on('error', (err: any) => console.log('Download Failed', err));
    dl.start().catch((err: any) => console.error(err));
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

//yarn run downloadPdf