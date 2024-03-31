import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../cliBased/utils";
import * as fs from 'fs';
import { getAllPDFFilesWithMedata } from "../imgToPdf/utils/FileUtils";
import { FileStats } from "../imgToPdf/utils/types";
import { sizeInfo } from "../mirror/FrontEndBackendCommonCode";
import * as path from 'path';
import moment from "moment";
import { DD_MM_YYYY_HH_MMFORMAT } from "../utils/constants";

const _root = "C:\\_catalogWork\\_collation\\local";

export const moveProfilesToFreeze = async (profileAsCSV: string, flatten: boolean = true) => {
    const _response = []
    for (let profile of profileAsCSV.split(',')) {
        const srcPath = getFolderInSrcRootForProfile(profile.trim());
        const destPath = getFolderInDestRootForProfile(profile.trim());
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        if (isValidPath(srcPath) && isValidPath(destPath)) {
            _response.push(await moveFileSrcToDest(srcPath, destPath, flatten));
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid srcPath ${srcPath} or destPath ${destPath} for PROFILE: ${profile}`
            });
        }
    }
    return {
        response: _response
    };
}

export const moveFileSrcToDest = async (srcPath: string, destFolderOrProfile: string, flatten: boolean = true) => {
    const destPath = isValidPath(destFolderOrProfile) ? destFolderOrProfile : getFolderInSrcRootForProfile(destFolderOrProfile)
    try {
        console.log(`moveFileSrcToDest srcPath ${srcPath}/${destFolderOrProfile} destPath ${destPath}  flatten ${flatten}`)
        let _report
        if (flatten) {
            _report = await moveFilesAndFlatten(srcPath, destPath);
        }
        else {
            //get this ready
            _report = await moveFilesAndFlatten(srcPath, destPath);
        }
        return {
            ..._report
        };
    }
    catch (err) {
        console.log('Error', err);
        return {
            success: false,
            msg: `Error while moving files from ${srcPath} to ${destPath} \n${err}`,
            err: err
        };
    }
}

const getFoldersFromInput = (argFirst: string) => {
    const profileOrPaths = argFirst.includes(",") ? argFirst.split(",").map((link: string) => link.trim()) : [argFirst.trim()];
    console.log(`profileOrPaths ${profileOrPaths}`);

    const pdfDumpFolders = isValidPath(profileOrPaths[0]) ? profileOrPaths :
        profileOrPaths.map((_profileOrPath: string) => {
            return getFolderInDestRootForProfile(_profileOrPath)
        });

    console.log(`pdfDumpFolders ${pdfDumpFolders}`)

    return pdfDumpFolders
}

export const publishBookTitles = async (argFirst: string, pdfsOnly = true) => {
    const pdfDumpFolders = getFoldersFromInput(argFirst);

    const _response = []
    for (let folder of pdfDumpFolders) {
        if (isValidPath(folder)) {
            const metadata = await getAllPDFFilesWithMedata(folder);
            createPdfReportAsText(metadata, pdfsOnly, path.basename(folder));
            createExcelReport(metadata, pdfsOnly, path.basename(folder))
            _response.push({ success: true, msg: `Published book titles for ${folder}` });
        }
        else {
            _response.push({
                success: false,
                msg: `Invalid folder ${folder}`
            });
        }
    }
    return {
        response: _response
    };
}

function createPdfReportAsText(metadata: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    const report = generateTextFile(metadata, pdfsOnly);
    const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
    const fileName = `${folderBase}_MegaList_${pdfsOnly ? 'pdfs_only' : 'all_files'}-${timeComponent}.txt`;
    fs.writeFileSync(`${_root}\\${folderBase}\\${fileName}`, report);
}

function generateTextFile(metadata: Array<FileStats>, pdfsOnly: boolean) {
    console.log(`generateTextFile ${metadata.length} pdfsOnly ${pdfsOnly}`)
    let report = '';
    let totalFileCount = 0
    let totalSize = 0
    let totalPageCount = 0
    metadata.forEach((fileStats: FileStats) => {
        report += `${fileStats.rowCounter}). ${fileStats.fileName}, ${fileStats.pageCount} pages, ${fileStats.size}\n`
        totalFileCount += 1;
        totalSize += fileStats.rawSize;
        totalPageCount = fileStats.pageCount
    });

    const summary = `PDF Stats:
    Total File Count: ${totalFileCount}
    Total Files Processed: ${totalFileCount}
    Total Files with Errors(including password-protected): ?
    Total Files system didnt pick: ?
    Erroneous File List: ?
    Password Protected Erroneous File List: ?
    Total Files Read Successfully: ${totalFileCount}
    Total Size of Files: ${sizeInfo(totalSize)}
    Total Pages: ${totalPageCount}`

    const fullReport = `${report}
    ${summary}`
    console.log(fullReport)
    return fullReport;
}

function createExcelReport(metadata: Array<FileStats>, pdfsOnly: boolean, folderBase: string) {
    generateExcelOfPdfMetadata(metadata, pdfsOnly)
}

function generateExcelOfPdfMetadata(metadata: Array<FileStats>, pdfsOnly: boolean) {
    console.log(`generateExcelOfPdfMetadata-InConstruction ${metadata.length} pdfsOnly ${pdfsOnly}`)
}
