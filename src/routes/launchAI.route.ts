import * as express from 'express';
<<<<<<< HEAD
import { getAllPDFFilesWithIgnorePathsSpecified } from '../utils/FileStatsUtils';
=======
import { zipAndSendFormData } from '../services/aiService';
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3

export const launchAIRoute = express.Router();

launchAIRoute.post('/renamePdfsWithAI', async (req: any, resp: any) => {
    try {
        const profileName = req?.body?.profileName;
        const folderPath = req?.body?.folderPath || "";

        if (!folderPath) {
            return resp.status(300).send({
<<<<<<< HEAD
                response: {
                    "status": "failed",
=======
                "status": "failed",
                response: {
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
                    "success": false,
                    "msg": "Pls. provide Folder Path. it is mandatory"
                }
            });
        }
<<<<<<< HEAD
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

=======

        await zipAndSendFormData(folderPath, resp);
    }
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

