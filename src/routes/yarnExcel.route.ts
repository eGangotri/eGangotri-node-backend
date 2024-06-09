import * as express from 'express';
import { createExcelV3FileForUpload } from '../services/GradleLauncherUtil';
import { getJsonOfAbsPathFromProfile } from '../services/yarnExcelService';

export const yarnExcelRoute = express.Router();

yarnExcelRoute.post('/createExcelOfAbsPathFromProfile', async (req: any, resp: any) => {
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
                resp.status(200).send({
                    success: false,
                    msg: `Error while creating Excel file for profile ${profile}`,
                    response: `${err.message}`
                });
            }
        }

        resp.status(200).send({
            response: {
                msg: `Created ${result.length} Excel file(s) with (${result.map((res) => res.length)} items in each file.`,
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
