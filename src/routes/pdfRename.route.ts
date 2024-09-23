import * as express from 'express';
import { RenamePdfFormData } from '../mirror/types';

export const pdfRenameRoute = express.Router();

pdfRenameRoute.post('/rename', async (req: any, resp: any) => {
    try {
        const bodyEntries: RenamePdfFormData = req.body as RenamePdfFormData;
        bodyEntries.dateOfExecution = new Date();

        if (!bodyEntries?.originalPdfName) {
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "No Original Pdf Name."
                }
            });
        }

        console.log(`bodyEntries : ${JSON.stringify(bodyEntries)}`);
        const res = []
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



