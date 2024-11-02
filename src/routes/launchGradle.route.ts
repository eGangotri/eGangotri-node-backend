import * as express from 'express';
import { launchUploader, launchUploaderViaAbsPath, launchUploaderViaExcelV1, launchUploaderViaExcelV3, launchUploaderViaExcelV3Multi, launchUploaderViaJson, loginToArchive, makeGradleCall, moveToFreeze, reuploadMissed, snap2htmlCmdCall } from '../services/gradleLauncherService';
import { ArchiveProfileAndTitle, UploadCycleArchiveProfile } from '../mirror/types';
import { isValidPath } from '../utils/utils';
import { getFolderInDestRootForProfile, getFolderInSrcRootForProfile } from '../archiveUpload/ArchiveProfileUtils';
import { ItemsUshered } from '../models/itemsUshered';
import { UploadCycle } from '../models/uploadCycle';
import { excelToJson } from '../cliBased/excel/ExcelUtils';
import { ArchiveUploadExcelProps } from '../archiveDotOrg/archive.types';
import { createExcelV1FileForUpload, createExcelV3FileForUpload, createJsonFileForUpload, findMissedUploads } from '../services/GradleLauncherUtil';
import { itemsUsheredVerficationAndDBFlagUpdate } from '../services/itemsUsheredService';
import { getLatestUploadCycle } from '../services/uploadCycleService';
import { checkIfEmpty } from '../utils/FileUtils';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';

export const launchGradleRoute = express.Router();

launchGradleRoute.get('/launchUploader', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        let subjectDesc = req.query?.subjectDesc || ""
        if (subjectDesc && subjectDesc.trim() !== "") {
            subjectDesc = `subjectDesc=${subjectDesc}`
        }
        console.log(`launchUploader ${_profiles} ${subjectDesc}`)
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
            const res = await launchUploader(req.query.profiles, subjectDesc)
            //dont wait. let it run in background
            getLatestUploadCycle().then((uploadCycleId) => {
                console.log(`uploadCycleId ${uploadCycleId}`)
                itemsUsheredVerficationAndDBFlagUpdate(uploadCycleId);
                setTimeout(() => {
                    itemsUsheredVerficationAndDBFlagUpdate(uploadCycleId);
                }, 300000); // 5 minutes
            });

            resp.status(200).send({
                response: res
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchGradleRoute.get('/launchUploaderViaExcelV1', async (req: any, resp: any) => {
    try {
        console.log(`launchUploaderViaExcelV1 ${req.query.profile} ${req.query.excelPath} ${req.query.uploadCycleId}`)
        const res = await launchUploaderViaExcelV1(req.query.profile, req.query.excelPath, req.query.uploadCycleId)
        resp.status(200).send({
            response: {
                success: true,
                res
            }
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})


launchGradleRoute.get('/launchUploaderViaJson', async (req: any, resp: any) => {
    try {
        const gradleArgs = req.query.gradleArgs
        console.log(`launchUploaderViaJson ${gradleArgs}`)
        const res = await launchUploaderViaJson(req.query.gradleArgs)
        resp.status(200).send({
            response: {
                success: true,
                res
            }
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})

launchGradleRoute.get('/launchUploaderViaUploadCycleId', async (req: any, resp: any) => {
    try {
        const uploadCycleId = req.query.uploadCycleId
        console.log(`launchUploaderViaUploadCycleId ${uploadCycleId}`)
        const uploadCyclesByCycleId = await ItemsUshered.find({
            uploadCycleId: uploadCycleId
        });
        //to account for nulls
        const _failedForUploadCycleId = uploadCyclesByCycleId.filter(x => x?.uploadFlag !== true)
        if (_failedForUploadCycleId.length > 0) {
            const jsonFileName = createJsonFileForUpload(uploadCycleId,
                _failedForUploadCycleId,
                `${_failedForUploadCycleId.length}-of-${uploadCyclesByCycleId.length}`)
            const res = await launchUploaderViaJson(jsonFileName)
            resp.status(200).send({
                response: {
                    success: true,
                    res
                }
            });
        }
        else {
            resp.status(200).send({
                response: {
                    success: true,
                    msg: `No Failed upload found for Upload Cycle Id: ${uploadCycleId}`
                }
            });

        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})

launchGradleRoute.get('/reuploadMissedViaUploadCycleId', async (req: any, resp: any) => {
    try {
        const uploadCycleId = req.query.uploadCycleId
        console.log(`reuploadMissedViaUploadCycleId ${uploadCycleId}`)
        const uploadCycleByCycleId = await UploadCycle.findOne({
            uploadCycleId: uploadCycleId
        });
        const allIntended = uploadCycleByCycleId.archiveProfiles.flatMap(x => x.absolutePaths)
        const _missedForUploadCycleId: UploadCycleArchiveProfile[]
            = await findMissedUploads(uploadCycleId);
        if (uploadCycleByCycleId.mode.startsWith("Regular")) {
            const _gradleResponseStreams: string[] = []
            for (let i = 0; i < _missedForUploadCycleId.length; i++) {
                const archiveProfile = _missedForUploadCycleId[i].archiveProfile;
                const missedAbsPaths = _missedForUploadCycleId[i].absolutePaths.map(x => {
                    return {
                        absPath: x
                    }
                });
                const excelFileName = createExcelV3FileForUpload(uploadCycleId, missedAbsPaths, `reupload-missed-${missedAbsPaths.length}-of-${allIntended.length}`)
                const respStream = await launchUploaderViaExcelV3(archiveProfile,
                    excelFileName,
                    uploadCycleId);
                _gradleResponseStreams.push(respStream)
            }
            resp.status(200).send({
                response: {
                    success: true,
                    msg: `ReUploaded ${_missedForUploadCycleId.length} missed items for Upload Cycle Id: ${uploadCycleId}`,
                    res: _gradleResponseStreams
                }
            });
        }
        else
            if (uploadCycleByCycleId.mode.startsWith("Excel-")) {
                //Excel-;${excelFileName}-;${range}
                let excelFileName = uploadCycleByCycleId.mode.split("-;")
                let _excelFileName = ""
                if (excelFileName.length >= 2) {
                    _excelFileName = excelFileName[1]
                }
                else {
                    resp.status(400).send({
                        response: {
                            success: false,
                            msg: `Invalid Mode ${uploadCycleByCycleId.mode}. Couldnt retrieve Excel Name from ${uploadCycleByCycleId.mode}`
                        }
                    });
                    return;
                }
                if (_missedForUploadCycleId.length > 0) {
                    console.log(`_excelFileName ${_excelFileName}`)
                    let excelAsJson: ArchiveUploadExcelProps[] = excelToJson(_excelFileName);
                    const missedAbsPaths = _missedForUploadCycleId[0].absolutePaths
                    const _missedInJSON = excelAsJson.filter((x: ArchiveUploadExcelProps) => missedAbsPaths.includes(x.absPath));
                    console.log(`_missedInJSON ${_missedInJSON.length}`)

                    const excelFileNameForMissed = createExcelV1FileForUpload(uploadCycleId, _missedInJSON,
                        `${_missedInJSON.length}-of-${allIntended.length}`, "reupload-missed-in-upload-cycle-id-")
                    const res = await launchUploaderViaExcelV1(uploadCycleByCycleId.archiveProfiles[0].archiveProfile,
                        excelFileNameForMissed,
                        uploadCycleId);

                    resp.status(200).send({
                        response: {
                            success: true,
                            res
                        }
                    });
                    return;
                }
                else {
                    resp.status(200).send({
                        response: {
                            success: true,
                            msg: `No Missed upload found for Upload Cycle Id: ${uploadCycleId}`
                        }
                    });

                }
            }
            else {
                resp.status(200).send({
                    response: {
                        success: false,
                        msg: `No Uploader configured yet for Upload Mode ${uploadCycleByCycleId.mode}`
                    }
                });
                return;
            }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})


launchGradleRoute.get('/reuploadFailed', async (req: any, resp: any) => {
    try {
        const uploadCycleId = req.query.uploadCycleId
        await itemsUsheredVerficationAndDBFlagUpdate(uploadCycleId);
        if (!uploadCycleId) {
            resp.status(400).send({
                response: {
                    success: false,
                    message: "uploadCycleId is required"
                }
            });
            return;
        }

        console.log(`reuploadFailed check for ${uploadCycleId}`)
        const uploadCyclesByCycleId = await ItemsUshered.find({
            uploadCycleId: uploadCycleId
        });
        //to account for nulls
        const _failedForUploacCycleId = uploadCyclesByCycleId.filter(x => x?.uploadFlag !== true)
        if (_failedForUploacCycleId.length > 0) {
            const jsonFileName = createJsonFileForUpload(uploadCycleId,
                _failedForUploacCycleId,
                `${_failedForUploacCycleId.length}-of-${uploadCyclesByCycleId.length}`)

            const res = await launchUploaderViaJson(jsonFileName)
            resp.status(200).send({
                response: {
                    success: true,
                    noFailedUploads: false,
                    res
                }
            });
        }
        else {
            resp.status(200).send({
                response: {
                    success: true,
                    noFailedUploads: true,
                    msg: `No Failed upload found for Upload Cycle Id: ${uploadCycleId}`
                }
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})



launchGradleRoute.get('/launchUploaderViaAbsPath', async (req: any, resp: any) => {
    try {
        const gradleArgs = req.query.gradleArgs
        console.log(`launchUploaderViaAbsPath ${gradleArgs}`)
        const res = await launchUploaderViaAbsPath(gradleArgs)
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                message: err.message
            }
        });
    }
})

launchGradleRoute.post('/reuploadMissedByProfileAndAbsPath', async (req: any, resp: any) => {
    try {
        const itemsForReupload: ArchiveProfileAndTitle[] = req.body.itemsForReupload
        const res = await reuploadMissed(itemsForReupload)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

//@deprecated
launchGradleRoute.get('/moveToFreeze', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        const _uploadCycleId = req.query.uploadCycleId;
        console.log(`moveToFreeze ${_profiles}`)
        const res = await moveToFreeze(req.query.profiles)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})


launchGradleRoute.get('/bookTitles', async (req: any, resp: any) => {
    try {
        const argFirst = req.query.argFirst
        const pdfsOnly = req.query.pdfsOnly

        const profileOrPaths = argFirst.includes(",") ? argFirst.split(",").map((link: string) => link.trim()) : [argFirst.trim()];
        console.log(`profileOrPaths ${profileOrPaths}`);

        const pdfDumpFolders = isValidPath(profileOrPaths[0]) ? profileOrPaths :
            profileOrPaths.map((_profileOrPath: string) => {
                return getFolderInDestRootForProfile(_profileOrPath)
            });

        console.log(`bookTitles ${pdfDumpFolders}`)
        const _cmd = `gradle bookTitles --args="paths='${pdfDumpFolders.join(",")}', pdfsOnly=${pdfsOnly}"`
        console.log(`_cmd ${_cmd}`)

        const res = await makeGradleCall(_cmd)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})

launchGradleRoute.get('/loginToArchive', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`loginToArchive ${_profiles}`)
        const res = await loginToArchive(req.query.profiles)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})

//Snap2HTMl.exe -path:"root folder path" -outfile:"filename"

launchGradleRoute.get('/snap2html', async (req: any, resp: any) => {
    try {
        const rootFolder = req.query.rootFolder

        console.log(`snap2html ${rootFolder}`)
        const res = await snap2htmlCmdCall(rootFolder)
        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})


launchGradleRoute.get('/launchUploaderViaExcelV3', async (req: any, resp: any) => {
    try {
        const { profiles, excelPaths, range } = req.query

        console.log(`launchUploaderViaExcelV3 ${profiles},${excelPaths}, ${range}`)
        if (profiles === undefined || excelPaths === undefined) {
            resp.status(400).send({
                response: {
                    success: false,
                    msg: `Profiles and ExcelPaths are mandatory`
                }
            });
            return;
        }

        const profilesAsArray = profiles.includes(",") ? profiles.split(",").map((x: string) => x.trim()) : [profiles.trim()];
        const excelPathsAsArray = excelPaths.includes(",") ? excelPaths.split(",").map((x: string) => x.trim()) : [excelPaths.trim()];

        const result = await launchUploaderViaExcelV3Multi(profilesAsArray,
            excelPathsAsArray,
            "", range);
        resp.status(200).send({ response: result });

        //v2

        /*
        const result = [];
        for (let i = 0; i < profilesAsArray.length; i++) {
           try {
               const respStream = await launchUploaderViaExcelV3(profilesAsArray[i],
                   excelPathsAsArray[i],
                   "", range);
               result.push({
                   success: true,
                   msg: `Upload for ${profiles} via ${excelPaths} with ${range} range performed`,
                   res: respStream
               });
           }
           catch (err: any) {
               console.log('Error:', err);
               result.push({
                   success: false,
                   err,
                   msg: `Error while uploading Excel file for profile ${profile}`
               });
           }
       }
       resp.status(200).send({ response: result });
       */
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: {
                success: false,
                err
            }
        });
    }
})

launchGradleRoute.post('/imgFilesToPdfGradleVersion', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const folder = req.body.folder;
        const imgType = req.body.imgType;
        const results = [];
        const _folder = folder.includes(",") ? folder.split(",").map((link: string) => link.trim()) : [folder.trim()];
        console.log(`gradle/imgFilesToPdf:folder: ${_folder} imgType: ${imgType}`);

        for (const aFolder of _folder) {
            console.log(`imgToPdf for ${aFolder}`)
            const escapedFolder = aFolder.replace(/\\/g, '\\\\');
            const _cmd = `gradle imgToPdf --args="\\"${escapedFolder}\\" \\"${imgType}\\""`;
            console.log(`_cmd ${_cmd}`);
            const res = await makeGradleCall(_cmd)
            results.push(res);
        }
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download downloadArchivePdfs: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            total: _folder.length,
            //  resultsSummary,
            response: results
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
