import * as express from 'express';
import { getAllPDFFilesWithIgnorePathsSpecified } from '../utils/FileStatsUtils';

export const launchAIRoute = express.Router();

launchAIRoute.post('/renamePdfsWithAI', async (req: any, resp: any) => {
    try {
        const profileName = req?.body?.profileName;
        const folderPath = req?.body?.folderPath || "";

        if (!folderPath) {
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Folder Path. it is mandatory"
                }
            });
        }
        const _resp = await getAllPDFFilesWithIgnorePathsSpecified(folderPath);

        _resp.forEach((item: any) => {
            console.log(item.absPath);
        });

        resp.status(200).send({
            response: {
                _results: _resp,
                caution: "This is a dummy response. Actual implementation is pending."
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

