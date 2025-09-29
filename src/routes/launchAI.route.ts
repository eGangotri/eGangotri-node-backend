import { aiRenameTitleUsingReducedFolder } from '../cliBased/ai/renaming-workflow/renamePdfsViaAI';
import * as express from 'express';
import * as fs from 'fs';
import { Request, Response } from 'express';
import { PdfTitleAndFileRenamingTrackerViaAI } from '../models/pdfTitleAndFileRenamingTrackerViaAI';
import { IPdfTitleRenamingViaAITracker, PdfTitleRenamingViaAITracker } from '../models/pdfTitleRenamingTrackerViaAI';
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


        let outputSuffix = req?.body?.outputSuffix || "-renamer"


        const _result = await aiRenameTitleUsingReducedFolder(srcFolder, reducedFolder, outputSuffix)
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


// ai/titleRenamer/list
launchAIRoute.get("/getAllTitleRenamerViaAIList", async (req: Request, res: express.Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        const pdfTitleRenamedItems: IPdfTitleRenamingViaAITracker[] = await PdfTitleRenamingViaAITracker.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfTitleRenamingViaAITracker.countDocuments()
        const results = {
            data: pdfTitleRenamedItems,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
        res.json(results)
    } catch (error) {
        console.log(`/pdfTitleRenamedItems error: ${JSON.stringify(error.message)}`);
        res.status(500).json({ message: "Error fetching GDrive downloads", error })
    }
});