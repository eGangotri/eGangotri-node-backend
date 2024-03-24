import { isValidPath } from "../utils/utils";
import { moveFilesAndFlatten } from "../cliBased/fileMover";
import { getFolderInSrcRootForProfile } from "../cliBased/utils";

export const moveFileSrcToDest = async (qaPath: string, folderOrProfile: string, flatten: boolean = true) => {
    const destPath = isValidPath(folderOrProfile) ? folderOrProfile : getFolderInSrcRootForProfile(folderOrProfile)
    try {
        console.log(`moveFileSrcToDest qaPath ${qaPath}/${folderOrProfile} destPath ${destPath}  flatten ${flatten}`)
        let _report
        if (flatten) {
            _report  = await moveFilesAndFlatten(qaPath, destPath);
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
