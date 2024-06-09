import * as express from 'express';
import path from 'path';
import { createExcelV1FileForUpload, createExcelV3FileForUpload } from '../services/GradleLauncherUtil';
import { findNonAscii, getJsonOfAbsPathFromProfile } from '../services/yarnExcelService';
import { getArchiveMetadataForProfile } from '../archiveUpload/utils';
import { callAksharamukhaToRomanColloquial } from '../aksharamukha/convert';

export const yarnExcelRoute = express.Router();

yarnExcelRoute.post('/createExcelV1OfAbsPathFromProfile', async (req: any, resp: any) => {
    try {
        const profiles = req?.body?.profiles;
        const script = req?.body?.script;
        const allNotJustPdfs = req?.body?.allNotJustPdfs;
        const useFolderNameAsDesc = req?.body?.useFolderNameAsDesc;

        if (!profiles) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "Profile is mandatory"
                }
            });
        }
        console.log(`profiles ${profiles} ${profiles?.split(",")} allNotJustPdfs ${allNotJustPdfs}`);
        const result = []
        const _profilesAsArray = profiles.includes(",") ? profiles?.split(",").map((x: string) => x.trim()) : [profiles.trim()];
        for (const profile of _profilesAsArray) {
            try {
                const _metadata = getArchiveMetadataForProfile(profile);
                const absPathsAsJsons = await getJsonOfAbsPathFromProfile(profile, allNotJustPdfs);
                for (const absPathAsJson of absPathsAsJsons) {
                    const fileName = path.basename(absPathAsJson['absPath']);
                    let description = _metadata.description;
                    if (script?.length > 0 && findNonAscii(fileName)) {
                        console.log(`Non-ASCII: ${fileName}`);
                        const toRomanCol = await callAksharamukhaToRomanColloquial(script, fileName);
                        description = `${description} ${toRomanCol}`;
                    }

                    if(useFolderNameAsDesc){
                        const folderName = path.dirname(absPathAsJson['absPath']);
                        description = `${description} ${folderName}`;

                        if (script?.length > 0 && findNonAscii(folderName)) {
                            console.log(`Non-ASCII:folderName: ${folderName}`);
                            const toRomanCol = await callAksharamukhaToRomanColloquial(script, folderName);
                            description = `${description} ${toRomanCol}`;
                        }
                    }

                    absPathAsJson['subject'] = _metadata.subjects;
                    absPathAsJson['description'] = _metadata.description;
                    absPathAsJson['creator'] = _metadata.creator;
                }
                const excelFileName = createExcelV1FileForUpload("", absPathsAsJsons,
                    `absPaths-as-excel-v1-${profile}-${absPathsAsJsons.length}}`)
                result.push({
                    profile: profile,
                    excelFileName: excelFileName,
                    length: absPathsAsJsons.length
                })
            }
            catch (err: any) {
                console.log('Error:', err);
                result.push({
                    success: false,
                    msg: `Error while creating Excel file V1 for profile ${profile}`,
                    response: `${err.message}`
                });
            }
        }

        resp.status(200).send({
            response: {
                msg: `Created ${result.length} Excel file(s) with (${result.map((res) => res.length)}) items in each file.`,
                profiles: result.map((res) => res.profile),
                excelFileNames: result.map((res) => res.excelFileName),
                info: "Excel-Path stored in Local Storage"
            }
        });
    }

    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})


yarnExcelRoute.post('/createExcelV3OfAbsPathFromProfile', async (req: any, resp: any) => {
    try {
        const profiles = req?.body?.profiles;
        const allNotJustPdfs = req?.body?.allNotJustPdfs;
        if (!profiles) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "Profile is mandatory"
                }
            });
        }
        console.log(`profiles ${profiles} ${profiles?.split(",")} allNotJustPdfs ${allNotJustPdfs}`);
        const result = []
        const _profilesAsArray = profiles.includes(",") ? profiles?.split(",").map((x: string) => x.trim()) : [profiles.trim()];
        for (const profile of _profilesAsArray) {
            try {
                const absPathsAsJsons = await getJsonOfAbsPathFromProfile(profile, allNotJustPdfs);
                const excelFileName = createExcelV3FileForUpload("", absPathsAsJsons, `absPaths-as-excel-${profile}-${absPathsAsJsons.length}`)
                result.push({
                    profile: profile,
                    excelFileName: excelFileName,
                    length: absPathsAsJsons.length
                })
            }
            catch (err: any) {
                console.log('Error:', err);
                result.push({
                    success: false,
                    msg: `Error while creating Excel file for profile ${profile}`,
                    response: `${err.message}`
                });
            }
        }

        resp.status(200).send({
            response: {
                msg: `Created ${result.length} Excel file(s) with (${result.map((res) => res.length)}) items in each file.`,
                profiles: result.map((res) => res.profile),
                excelFileNames: result.map((res) => res.excelFileName),
                info: "Excel-Path stored in Local Storage"
            }
        });
    }

    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})
