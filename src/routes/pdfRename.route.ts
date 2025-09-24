import * as express from 'express';
import { RenamePdfFormData } from '../mirror/types';
import { PdfTitleRenamingTrackerViaAI as PdfRenamer } from '../models/pdfTitleRenamingTrackerViaAI';

export const pdfRenameRoute = express.Router();

pdfRenameRoute.post('/rename', async (req: any, resp: any) => {
    try {
        const bodyEntries: RenamePdfFormData = req.body as RenamePdfFormData;
        bodyEntries.dateOfExecution = new Date();

        if (!bodyEntries?.originalPdfName) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "No Original Pdf Name."
                }
            });
        }

        console.log(`bodyEntries : ${JSON.stringify(bodyEntries)}`);
        const renamer = new PdfRenamer(bodyEntries);
        await renamer.save();
        resp.status(200).send({
            response: renamer._id
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



