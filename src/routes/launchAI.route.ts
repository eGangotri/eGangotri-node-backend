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
        console.log(`outputSuffixes: ${outputSuffixes}`);

        let outputSuffixesList: string[] = [];
        if (!outputSuffixes) {
            console.log("No output suffix provided, using default: -renamer");
            reducedFoldersList.forEach((folder: string) => {
                outputSuffixesList.push(`${path.basename(folder)}-renamer`);
            });
        }

        else {
            outputSuffixesList = outputSuffixes.split(",").map((suffix: string) => suffix.trim());
            console.log(`outputSiffixList(${outputSuffixesList.length}): ${outputSuffixesList}`)
            if (srcFoldersList.length !== outputSuffixesList.length) {
                // If a single suffix is provided, apply it to all src folders
                if (outputSuffixesList.length === 1) {
                    outputSuffixesList = Array(srcFoldersList.length).fill(outputSuffixesList[0]);
                } else {
                    return resp.status(400).send({
                        "status": "failed",
                        response: {
                            "success": false,
                            "msg": "OutputSuffixes Count doesnt match Src Folder Count"
                        }
                    });
                }
            }
        }
 
        const _renamingResults = [];
        for (let i = 0; i < srcFoldersList.length; i++) {
            const _result = await aiRenameTitleUsingReducedFolder(srcFoldersList[i],
                 reducedFoldersList[i], outputSuffixesList[i])
            _renamingResults.push(_result);
        }

        const _aggregatedResults = _renamingResults.map((result: any) => ({
            runId: result.runId,
            success: result.success,
            processedCount: result.processedCount,
            successCount: result.successCount,
            failedCount: result.failedCount,
            errorCount: result.errorCount ?? 0,
            metaDataAggregated: result.metaDataAggregated,
            renamingResults: result.renamingResults,
            error: result.error,
        }));

        const summary = _aggregatedResults.reduce(
            (acc: { runs: number; processedCount: number; successCount: number; failedCount: number; errorCount: number }, cur: any) => {
                acc.runs += 1;
                acc.processedCount += Number(cur.processedCount || 0);
                acc.successCount += Number(cur.successCount || 0);
                acc.failedCount += Number(cur.failedCount || 0);
                acc.errorCount += Number(cur.errorCount || 0);
                return acc;
            },
            { runs: 0, processedCount: 0, successCount: 0, failedCount: 0, errorCount: 0 }
        );
        const overallSuccess = summary.failedCount === 0 && _aggregatedResults.every((r: any) => r.success === true);
        resp.status(200).send({
            "status": "success",
            response: {
                "success": overallSuccess,
                "msg": overallSuccess ? "Renaming completed successfully." : "Renaming completed with failures.",
                "aggregated": _aggregatedResults,
                "summary": summary,
                "results": _renamingResults,
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

launchAIRoute.get("/getAllTitleRenamedViaAIListGroupedByRunId", async (req: Request, res: express.Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Aggregate to group by runId and count documents per run
        const pipeline = [
            { $group: { _id: "$runId", count: { $sum: 1 }, maxCreatedAt: { $max: "$createdAt" }, minCreatedAt: { $min: "$createdAt" } } },
            { $sort: { maxCreatedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: 1, runId: "$_id", count: 1, createdAt: "$minCreatedAt" } },
        ];

        const grouped = await (PdfTitleRenamingViaAITracker as any).aggregate(pipeline);
        const totalDistinctRunIds = (await PdfTitleRenamingViaAITracker.distinct("runId")).length;

        const results = {
            data: grouped as Array<{ _id: string; runId: string; count: number; createdAt: Date }>,
            currentPage: page,
            totalPages: Math.ceil(totalDistinctRunIds / limit),
            totalItems: totalDistinctRunIds,
        };
        res.json(results);
    } catch (error: any) {
        console.log(`/pdfTitleRenamedItems error: ${JSON.stringify(error.message)}`);
        res.status(500).json({ message: "Error fetching pdfTitleRenamedItems grouped by runId", error });
    }
});



// ai/getAllTitleRenamedViaAIList by runId
launchAIRoute.get("/getAllTitleRenamedViaAIList/:runId", async (req: Request, res: express.Response) => {
    try {
        const runId = req.params.runId;
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        const filter = { runId };
        const pdfTitleRenamedItems: IPdfTitleRenamingViaAITracker[] = await PdfTitleRenamingViaAITracker.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfTitleRenamingViaAITracker.countDocuments(filter)
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
})
;

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
