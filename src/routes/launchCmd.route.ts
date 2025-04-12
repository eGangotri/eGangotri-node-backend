import * as express from 'express';
import { execPromise } from '../exec/exec';

export const launchCmdRoute = express.Router();

launchCmdRoute.get('/closeAllChrome', async (req: any, resp: any) => {
    try {
        const command = 'taskkill /F /IM chrome.exe';
        const result = await execPromise(command);
        resp.status(200).send({
            response: result
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
