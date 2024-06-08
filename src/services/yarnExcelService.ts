import { LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC } from '../cliBased/utils';
import * as express from 'express';
import { getAllFileListingWithoutStats, getAllPDFFiles } from '../utils/FileStatsUtils';

export const yarnExcelRoute = express.Router();

export const getJsonOfAbsPathFromProfile = async (profile: string, allNotJustPdfs: boolean) => {
    const profileFolder = LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.get(profile);
    console.log(`profileFolder ${profile}:${profileFolder} allNotJustPdfs ${allNotJustPdfs}`);

    if (!profileFolder) {
        throw new Error(`Profile '${profile}' not found. Please check the profile name and try again.`);
    }
    let filesForUpload = []
    if (allNotJustPdfs) {
        filesForUpload = await getAllFileListingWithoutStats({ directoryPath: profileFolder });
    } else {
        filesForUpload = await getAllPDFFiles(profileFolder);
    }
    console.log(`filesForUpload ${filesForUpload.length}`);

    const filesAsJson = filesForUpload.map((file) => {
        return {
            "absPath": file.absPath,
        }
    });
    return filesAsJson;
}

