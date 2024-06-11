import * as express from 'express';
import { createExcelV3FileForUpload } from '../services/GradleLauncherUtil';
import { generateV1ExcelsForMultipleProfiles, getJsonOfAbsPathFromProfile } from '../services/yarnExcelService';
import { toTitleCase } from '../utils/StringUtils';

export const yarnExcelRoute = express.Router();

yarnExcelRoute.post('/createExcelV1OfAbsPathFromProfile', async (req: any, resp: any) => {
    try {
        const profiles = req?.body?.profiles;
        const script = req?.body?.script as string;
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
        console.log(`profiles ${profiles} 
            ${profiles?.split(",")} 
            script: ${script}
        useFolderNameAsDesc: ${useFolderNameAsDesc}
        allNotJustPdfs ${allNotJustPdfs}`);
        
        const res = await generateV1ExcelsForMultipleProfiles(profiles, toTitleCase(script), allNotJustPdfs, useFolderNameAsDesc);
        resp.status(200).send({
            response: res
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
