import * as express from 'express';
import { aiRenameUsingReducedFolder } from '../cliBased/ai/renaming-workflow/renamePdfsViaAI';
import * as fs from 'fs';

export const launchAIRoute = express.Router();

//ai/aiRenamer
launchAIRoute.post('/aiRenamer', async (req: any, resp: any) => {
    try {
        const srcFolder = req?.body?.srcFolder;
        const reducedFolder = req?.body?.reducedFolder || "";

        if (!reducedFolder && !srcFolder) {
            return resp.status(400).send({
                "status": "failed",
                response: {
                    "success": false,
                    "msg": "Pls. provide both Soruce Folder and Reduced Folder Path."
                }
            });
        }


        let outputFolder = req?.body?.outputFolder || ""
        if (!outputFolder) {
            outputFolder =`${srcFolder}_renamer`
            if(!fs.existsSync(outputFolder)) {
                fs.mkdirSync(outputFolder, { recursive: true });
            }
        }
        
        const _result = await aiRenameUsingReducedFolder(srcFolder, reducedFolder, outputFolder)
        resp.status(200).send({
            "status": "success",
            response: {
                ..._result
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
