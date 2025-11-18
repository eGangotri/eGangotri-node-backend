

import { getArchiveMetadataForProfile, getFolderInSrcRootForProfile, isValidArchiveProfile } from '../archiveUpload/ArchiveProfileUtils';
import * as express from 'express';
import { getAllPdfsInFolders } from '../imgToPdf/utils/Utils';
import { itemsUsheredVerficationAndDBFlagUpdate } from '../services/itemsUsheredService';
import { executePythonPostCall } from '../services/pythonRestService';
import { getLatestUploadCycle } from '../services/uploadCycleService';
import { checkIfEmpty, isValidPath, getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { isPDFCorrupted } from '../utils/pdfValidator';

export const pythonArchiveRoute = express.Router();

pythonArchiveRoute.post('/bulk-upload-pdfs', async (req: any, resp: any) => {
    try {
        const profiles = req?.body?.profiles;
        const profilesAsFolders = profiles.map((p: string) => getPathOrSrcRootForProfile(p));

        if (!profiles || profiles.length === 0 || profilesAsFolders.some((p: string) => !isValidArchiveProfile(p))) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide valid Profile"
                }
            });
            return;
        }


    } catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

const checkEmptyProfiles = async (_profiles: string) => {
    const emptyProfiles = []

    for (let profile of _profiles.split(",")) {
        const srcPath = getFolderInSrcRootForProfile(profile.trim());
        const isEmpty = await checkIfEmpty(srcPath)
        if (isEmpty) {
            emptyProfiles.push(`${profile} (${srcPath})`);
        }
        else {
            console.log(`${profile} (${srcPath}) Folder is not empty`)
        }
    }
    return emptyProfiles
}

const checkCorruptProfiles = async (_profiles: string) => {

    const getAllUploadableFolders = _profiles.split(",").map((profile: string) => getFolderInSrcRootForProfile(profile.trim()));
    const _pdfs = await getAllPdfsInFolders(getAllUploadableFolders);
    const corruptionCheck = []
    for (let pdf of _pdfs) {
        corruptionCheck.push(isPDFCorrupted(pdf))
    }

    const corruptionCheckRes = await Promise.all(corruptionCheck)
    const isCorrupted = corruptionCheckRes.filter(result => !result.isValid)
    return isCorrupted
}

pythonArchiveRoute.post('/bulk-upload-pdfs', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        let subjectDesc = req.query?.subjectDesc || ""
        console.log(`launchUploader ${_profiles} ${subjectDesc}`)
        const emptyProfiles = await checkEmptyProfiles(_profiles)

        if (emptyProfiles.length > 0) {
            resp.status(400).send({
                response: {
                    success: false,
                    message: `Cannot proceed. Following Profiles are empty: ${emptyProfiles}`
                }
            });
            return;
        }
        else {
            const corruptedItems = await checkCorruptProfiles(_profiles)
            if (corruptedItems.length > 0) {
                resp.status(400).send({
                    response: {
                        success: false,
                        message: `Cannot proceed.\r\nFollowing (${corruptedItems.length}) PDFs are corrupted: ${corruptedItems.map(x => x.filePath).join(", ")}`
                    }
                });
                return;
            }

        }

        const profilesAsList = _profiles.split(",").map((profile: string) => profile.trim());
        const responses = []
        for (const profile of profilesAsList) {
            const _metadata = getArchiveMetadataForProfile(profile);
            const payload = {
                "directory_path": req?.body?.directory_path,
                "metadata": {
                    "creator": _metadata.creator,
                    "subject": _metadata.subject + (subjectDesc?.trim()?.length > 0 ? ` , ${subjectDesc}` : ""),
                    "description": _metadata.description + (subjectDesc?.trim()?.length > 0 ? ` , ${subjectDesc}` : "")
                },
                "accepted_extensions": req?.body?.accepted_extensions || [".pdf"]
            }
            const _resp = await executePythonPostCall(payload, 'bulk-upload-pdfs');
            responses.push(_resp)
        }

        //dont wait. let it run in background
        getLatestUploadCycle().then((uploadCycleId) => {
            console.log(`uploadCycleId ${uploadCycleId}`)
            itemsUsheredVerficationAndDBFlagUpdate(uploadCycleId);
            setTimeout(() => {
                itemsUsheredVerficationAndDBFlagUpdate(uploadCycleId);
            }, 1800000); // 30 minutes
        });

        resp.status(200).send({
            response: responses
        });



        

    }
    catch (err: any) {
    console.log('Error', err);
    resp.status(400).send(err);
}
})