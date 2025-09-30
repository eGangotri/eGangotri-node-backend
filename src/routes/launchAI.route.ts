import { aiRenameTitleUsingReducedFolder } from '../cliBased/ai/renaming-workflow/renamePdfsViaAI';
import * as express from 'express';
import * as fs from 'fs';
import { Request, Response } from 'express';
import { IPdfTitleAndFileRenamingTrackerViaAI, PdfTitleAndFileRenamingTrackerViaAI } from '../models/pdfTitleAndFileRenamingTrackerViaAI';
import { IPdfTitleRenamingViaAITracker, PdfTitleRenamingViaAITracker } from '../models/pdfTitleRenamingTrackerViaAI';
import path from 'path';
export const launchAIRoute = express.Router();

//ai/aiRenamer
launchAIRoute.post('/aiRenamer', async (req: any, resp: any) => {
    try {
        const srcFolders = req?.body?.srcFolder;
        const reducedFolders = req?.body?.reducedFolder || "";

        if (!reducedFolders && !srcFolders) {
            return resp.status(400).send({
                "status": "failed",
                response: {
                    "success": false,
                    "msg": "Pls. provide both Soruce Folder and Reduced Folder Path."
                }
            });
        }


        let outputSuffixes = req?.body?.outputSuffix

        const srcFoldersList = srcFolders.split(",");
        const reducedFoldersList = reducedFolders.split(",");
        if (!outputSuffixes) {
            outputSuffixes = "-renamer";
        }


        if (srcFoldersList.length !== reducedFoldersList.length) {
            return resp.status(400).send({
                "status": "failed",
                response: {
                    "success": false,
                    "msg": "Pls. provide both Soruce Folder and Reduced Folder Path."
                }
            });
        }

        let outputSuffixesList = [];
        if (!outputSuffixes) {
            console.log("No output suffix provided, using default: -renamer");
            outputSuffixesList = ["-renamer"];
            reducedFoldersList.forEach((folder:string) => {
                outputSuffixesList.push(`${path.basename(folder)}-renamer`);
            });
        }

        else {
            const outputSuffixesList = outputSuffixes.split(",");
            if(srcFoldersList.length !== outputSuffixesList.length) {
                return resp.status(400).send({
                    "status": "failed",
                    response: {
                        "success": false,
                        "msg": "OutputSuffixes Count doesnt match Src Folder Count"
                    }
                });
            }
        }


        const _renamingResults = [];
        for (let i = 0; i < srcFoldersList.length; i++) {
            const _result = await aiRenameTitleUsingReducedFolder(srcFoldersList[i], reducedFoldersList[i], outputSuffixesList[i])
            _renamingResults.push(_result);
        }

        resp.status(200).send({
            "status": "success",
            response: {
                "success": true,
                "msg": "Renaming completed successfully.",
                "results": _renamingResults
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

// ai/getAllTitleRenamedViaAIList
launchAIRoute.get("/getAllTitleRenamedViaAIList", async (req: Request, res: express.Response) => {
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
        res.status(500).json({ message: "Error fetching pdfTitleRenamedItems", error })
    }
});

//ai/getAllTitlePdfRenamedViaAIList
launchAIRoute.get("/getAllTitlePdfRenamedViaAIList", async (req: Request, res: express.Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        const pdfTitlePdfRenamedItems: IPdfTitleAndFileRenamingTrackerViaAI[] = await PdfTitleAndFileRenamingTrackerViaAI.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfTitleAndFileRenamingTrackerViaAI.countDocuments()
        const results = {
            data: pdfTitlePdfRenamedItems,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
        res.json(results)
    } catch (error) {
        console.log(`/pdfTitlePdfRenamedItems error: ${JSON.stringify(error.message)}`);
        res.status(500).json({ message: "Error fetching pdfTitlePdfRenamedItems", error })
    }
});
