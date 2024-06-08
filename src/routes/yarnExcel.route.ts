import * as express from 'express';
import { createExcelV3FileForUpload } from '../services/GradleLauncherUtil';
import { getJsonOfAbsPathFromProfile } from '../services/yarnExcelService';

export const yarnExcelRoute = express.Router();

yarnExcelRoute.post('/createExcelOfAbsPathFromProfile', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;
        const allNotJustPdfs = req?.body?.allNotJustPdfs;
        if (!profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "Profile is mandatory"
                }
            });
        }
        const absPathsAsJsons = await getJsonOfAbsPathFromProfile(profile, allNotJustPdfs);
        const excelFileName = createExcelV3FileForUpload("", absPathsAsJsons, `absPaths-as-excel-${profile}-${absPathsAsJsons.length}`)

        resp.status(200).send({
            response: {
                msg: `Created Excel file at ${excelFileName} with ${absPathsAsJsons.length} rows`,
                excelFileName: excelFileName,
                info:"Excel-Path stored in Local Storage"
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
