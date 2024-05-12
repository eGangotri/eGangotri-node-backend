import { LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC } from '../cliBased/utils';
import * as express from 'express';
import { getAllFileListingWithoutStats, getAllPDFFiles } from '../imgToPdf/utils/FileUtils';
import { createExcelV3FileForUpload } from '../services/GradleLauncherUtil';

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
        const profileFolder = LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.get(profile);
        console.log(`profileFolder ${profileFolder} pdfOnly ${allNotJustPdfs}`);

        let filesForUpload = []
        if (allNotJustPdfs) {
            filesForUpload = await getAllFileListingWithoutStats(profileFolder);
        } else {
            filesForUpload = await getAllPDFFiles(profileFolder);
        }
        console.log(`filesForUpload ${filesForUpload.length}`);

        const filesAsJson = filesForUpload.map((file) => {
            return {
                "absPath": file.absPath,
            }
        });
        const excelFileName = createExcelV3FileForUpload("", filesAsJson, `absPaths-as-excel-${filesAsJson.length}`)

        resp.status(200).send({
            response: `Created Excel file at ${excelFileName} with ${filesAsJson.length} rows`
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
