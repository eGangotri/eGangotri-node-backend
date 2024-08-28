import * as express from 'express';
import { getAllPDFFilesWithIgnorePathsSpecified } from '../utils/FileStatsUtils';
import { zipFiles } from '../services/zipService';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../utils/utils';
const path = require('path');

export const launchAIRoute = express.Router();

launchAIRoute.post('/renamePdfsWithAI', async (req: any, resp: any) => {
    try {
        const profileName = req?.body?.profileName;
        const folderPath = req?.body?.folderPath || "";

        if (!folderPath) {
            return resp.status(300).send({
                "status": "failed",
                response: {
                    "success": false,
                    "msg": "Pls. provide Folder Path. it is mandatory"
                }
            });
        }
        const _resp = await getAllPDFFilesWithIgnorePathsSpecified(folderPath);
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        const _files = _resp.map(x => x.absPath);
        const _ouptutZipPath = path.join(__dirname, `../zipDump/output-${timeComponent}.zip`);
        await zipFiles(_files, _ouptutZipPath);
        resp.status(200).send({
            response: {
                _results: _resp,
                _ouptutZipPath: _ouptutZipPath,
                caution: "This is a dummy response. Actual implementation is pending."
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

