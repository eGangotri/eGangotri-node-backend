import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from "../cliBased/utils";

export const moveProfilesToFreeze = async (profileAsCSV: string, flatten: boolean = true) => {
    const _response = []
    for (let profile of profileAsCSV.split(',')) {
        const srcPath = getFolderInSrcRootForProfile(profile.trim());
        const destPath = getFolderInDestRootForProfile(profile.trim());
        _response.push(await moveFileSrcToDest(srcPath, destPath, flatten));
    }
    return {
        response: _response
    };
}

export const moveFileSrcToDest = async (qaPath: string, folderOrProfile: string, flatten: boolean = true) => {
    const destPath = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
    try {
        console.log(`moveFileSrcToDest qaPath ${qaPath}/${folderOrProfile} destPath ${destPath}  flatten ${flatten}`)
        let _report
        if (flatten) {
            _report = await moveFilesAndFlatten(qaPath, destPath);
        }
        else {
            //get this ready
            _report = await moveFilesAndFlatten(qaPath, destPath);
        }
        return {
            ..._report
        };
    }
    catch (err) {
        console.log('Error', err);
        return {
            msg: `Error while moving files from ${qaPath} to ${destPath}`,
        };
    }
}
