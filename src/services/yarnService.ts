import { moveFilesAndFlatten, moveFilesWithFolders } from "../cliBased/fileMover";
import { getFolderInSrcRootForProfile } from "../cliBased/utils";

export const moveFileSrcToDest = async (qaPath: string, dest: string, profile: boolean = true, flatten: boolean=true) => {
    const destPath = profile ? getFolderInSrcRootForProfile(dest) : dest;
    console.log(`moveFileSrcToDest qaPath ${qaPath}/${dest} destPath ${destPath} profile ${profile} flatten ${flatten}`)
    if (flatten) {
        moveFilesAndFlatten(qaPath, destPath);
    }
    else {
        moveFilesWithFolders(qaPath, destPath);
    }

    return {
        msg2: `Task ushered`
    };
}
