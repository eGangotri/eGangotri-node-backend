import * as express from 'express';
import { launchUploader, launchUploaderViaAbsPath, launchUploaderViaExcel, launchUploaderViaJson, loginToArchive, makeGradleCall, moveToFreeze, reuploadMissed } from '../services/gradleLauncherService';
import { ArchiveProfileAndTitle, UploadCycleArchiveProfile } from '../mirror/types';
import { isValidPath } from '../utils/utils';
import { getFolderInDestRootForProfile } from '../cliBased/utils';
import { ItemsUshered } from '../models/itemsUshered';
import { UploadCycle } from '../models/uploadCycle';
import { excelToJson } from '../cliBased/excel/ExcelUtils';
import { ArchiveUploadExcelProps } from '../archiveDotOrg/archive.types';
import { createExcelV1FileForUpload, createJsonFileForUpload, findMissedUploads } from '../services/GradleLauncherUtil';
import { PERCENT_SIGN_AS_FILE_SEPARATOR } from '../mirror/utils';
import { itemsUsheredVerficationAndDBFlagUpdate } from 'services/itemsUsheredService';

export const launchGradleRoute = express.Router();

launchGradleRoute.get('/launchUploader', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
        console.log(`launchUploader ${_profiles}`)
        const res = await launchUploader(req.query.profiles)
        resp.status(200).send({
            response: res
        });

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchGradleRoute.get('/launchUploaderViaExcel', async (req: any, resp: any) => {
    try {
        const gradleArgs = req.query.gradleArgs
        console.log(`launchUploaderViaExcel ${gradleArgs}`)
        const res = await launchUploaderViaExcel(req.query.gradleArgs)
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

launchGradleRoute.get('/launchUploaderForMissedViaUploadCycleId', async (req: any, resp: any) => {
    try {
        const uploadCycleId = req.query.uploadCycleId
        console.log(`launchUploaderForMissedViaUploadCycleId ${uploadCycleId}`)
        const uploadCycleByCycleId = await UploadCycle.findOne({
            uploadCycleId: uploadCycleId
        });
        const allIntended = uploadCycleByCycleId.archiveProfiles.flatMap(x => x.absolutePaths)

        if (uploadCycleByCycleId.mode.startsWith("Regular")) {
            const _missedForUploadCycleId: UploadCycleArchiveProfile[]
                = await findMissedUploads(uploadCycleId);
            const _gradleResponseStreams: string[] = []
            for (let i = 0; i < _missedForUploadCycleId.length; i++) {
                const archiveProfile = _missedForUploadCycleId[i].archiveProfile;
                const absolutePaths = _missedForUploadCycleId[i].absolutePaths.join(PERCENT_SIGN_AS_FILE_SEPARATOR);
                const gradleArgs = `'${archiveProfile}' # '${absolutePaths}'`
                const respStream = await launchUploaderViaAbsPath(gradleArgs)
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
                const _missedForUploadCycleId: UploadCycleArchiveProfile[]
                    = await findMissedUploads(uploadCycleId);
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
                            msg: `Invalid Mode ${uploadCycleByCycleId.mode}. Couldnt retireve Excel Name from ${uploadCycleByCycleId.mode}`
                        }
                    });
                    return;
                }
                if (_missedForUploadCycleId.length > 0) {
                    console.log(`_excelFileName ${_excelFileName}`)
                    let excelAsJson: ArchiveUploadExcelProps[] = excelToJson(_excelFileName);
                    const missedAbsPaths = _missedForUploadCycleId[0].absolutePaths
                    const _missedInJSON = excelAsJson.filter((x: ArchiveUploadExcelProps) => missedAbsPaths.includes(x.absPath));
                    console.log(`_missedInJSON ${_missedInJSON.length} ${JSON.stringify(_missedInJSON)}`)

                    const excelFileNameForMissed = createExcelV1FileForUpload(uploadCycleId, _missedInJSON,
                        `${_missedInJSON.length}-of-${allIntended.length}`)
                    const res = await launchUploaderViaExcel(`'${uploadCycleByCycleId.archiveProfiles[0].archiveProfile}',
                    '${excelFileNameForMissed}',
                     '${uploadCycleId}'`);

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
                resp.status(400).send({
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

launchGradleRoute.post('/reuploadMissed', async (req: any, resp: any) => {
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


launchGradleRoute.get('/moveToFreeze', async (req: any, resp: any) => {
    try {
        const _profiles = req.query.profiles
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
