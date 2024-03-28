import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../cliBased/utils";
import * as fs from 'fs';
import { getAllPDFFilesWithMedata } from "../imgToPdf/utils/FileUtils";
import { FileStats } from "../imgToPdf/utils/types";

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
            generateTextFile(metadata, pdfsOnly);
            generateExcelOfPdfMetadata(metadata, pdfsOnly)
            _response.push({success: true, msg: `Published book titles for ${folder}`});
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


function generateTextFile(metadata: Array<FileStats>, pdfsOnly: boolean) {
    console.log(`generateTextFile-InConstruction ${metadata.length} pdfsOnly ${pdfsOnly}`)
}

function generateExcelOfPdfMetadata(metadata: Array<FileStats>, pdfsOnly: boolean) {
    console.log(`generateExcelOfPdfMetadata-InConstruction ${metadata.length} pdfsOnly ${pdfsOnly}`)
}
