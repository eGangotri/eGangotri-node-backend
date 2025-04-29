import * as express from 'express';
import { zipAndSendFormData } from '../services/aiService';

export const launchAIRoute = express.Router();

launchAIRoute.post('/renamePdfsWithAI', async (req: any, resp: any) => {
    try {
        const profileName = req?.body?.profileName;
        const folderPath = req?.body?.folderPath || "";

        if (!folderPath) {
            return resp.status(400).send({
                "status": "failed",
                response: {
                    "success": false,
                    "msg": "Pls. provide Folder Path. it is mandatory"
                }
            });
        }

        await zipAndSendFormData(folderPath, resp);
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

