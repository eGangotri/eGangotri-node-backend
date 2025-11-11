import * as express from 'express';
import { randomUUID } from 'crypto';
import { GDRIVE_DEFAULT_IGNORE_FOLDER } from '../services/GDriveService';
import { renameCPSByLink, RenameCPSByLinkResponse } from '../services/aiServices';
import { GDriveCpRenameHistory, IGDriveCpRenameHistory } from '../models/GDriveCpRenameHistory';

export const launchAIGDriveRoute = express.Router();

//ai/renameGDriveCPs
launchAIGDriveRoute.post('/renameGDriveCPs', async (req: any, resp: any) => {
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const ignoreFolder = req?.body?.ignoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;
        console.log(`:downloadFromGoogleDrive:
            googleDriveLink:
             ${googleDriveLink} 
            `)

        if (!googleDriveLink) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }

        const links = (googleDriveLink.includes(",") ? googleDriveLink.split(",").map((link: string) => link?.trim()) : [googleDriveLink?.trim()]).filter(Boolean);
        const megaResult: RenameCPSByLinkResponse[] = []
        const commonRunId: string = randomUUID()
        for (const link of links) {
            const result = await renameCPSByLink(link, ignoreFolder, commonRunId);
            megaResult.push(result);
            console.log(`result: ${JSON.stringify(result)}`)
        }

        const totalSuccessCount = megaResult.reduce((acc, result) => acc + (Number(result?.successCount) || 0), 0);
        const totalFailureCount = megaResult.reduce((acc, result) => acc + (Number(result?.failureCount) || 0), 0);
        const totalFileCount = megaResult.reduce((acc, result) => acc + (result?.totalFileCount || 0), 0);
        const totalErrorCount = megaResult.reduce((acc, result) => acc + ((result?.errors?.length || 0)), 0);

        return resp.status(200).send({
            response: {
                "status": "success",
                "message": `${megaResult.length} links processed`,
                totalSuccessCount,
                totalFailureCount,
                totalFileCount,
                totalErrorCount,
                "errors": megaResult.flatMap(result => result?.errors),
                "response": megaResult,
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchAIGDriveRoute.get('/gDriveRenamingHistory', async (req: any, resp: any) => {
    try {
        const runId = req?.body?.runId;
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit
        const filter = { runId };
        const gDriveCpRenameHistoryItems: IGDriveCpRenameHistory[] = await GDriveCpRenameHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await GDriveCpRenameHistory.countDocuments(filter)
        const results = {
            data: gDriveCpRenameHistoryItems,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
        resp.json(results)
    } catch (error) {
        console.log(`/gDriveCpRenameHistory error: ${JSON.stringify(error.message)}`);
        resp.status(500).json({ message: "Error fetching gDriveCpRenameHistory", error })
    }
})

launchAIGDriveRoute.get('/gDriveRenamingHistory/:runId', async (req: any, resp: any) => {
    try {
        const runId = req?.params?.runId;
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit
        const filter = { runId };
        const gDriveCpRenameHistoryItems: IGDriveCpRenameHistory[] = await GDriveCpRenameHistory.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await GDriveCpRenameHistory.countDocuments(filter)
        const results = {
            data: gDriveCpRenameHistoryItems,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
        resp.json(results)
    } catch (error) {
        console.log(`/gDriveCpRenameHistory error: ${JSON.stringify(error.message)}`);
        resp.status(500).json({ message: "Error fetching gDriveCpRenameHistory", error })
    }
});

launchAIGDriveRoute.get('/gDriveRenamingHistoryGroupedByRunId', async (req: any, resp: any) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const pipeline = [
            { $sort: { createdAt: 1 } },
            {
                $group: {
                    _id: "$runId",
                    commonRunId: { $first: "$commonRunId" },
                    totalCount: { $sum: 1 },
                    successCount: {
                        $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] }
                    },
                    failureCount: {
                        $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] }
                    },
                    firstCreatedAt: { $first: "$createdAt" },
                    lastCreatedAt: { $last: "$createdAt" },
                    mainGDriveLink: { $first: "$mainGDriveLink" }
                }
            },
            { $sort: { lastCreatedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    runId: "$_id",
                    commonRunId: 1,
                    successCount: 1,
                    failureCount: 1,
                    totalCount: 1,
                    createdAt: "$firstCreatedAt",
                    mainGDriveLink: 1
                }
            }
        ];

        const grouped = await (GDriveCpRenameHistory as any).aggregate(pipeline);
        const totalDistinctRunIds = (await GDriveCpRenameHistory.distinct("runId")).length;

        const results = {
            data: grouped as Array<{
                runId: string;
                commonRunId: string;
                successCount: number;
                failureCount: number;
                totalCount: number;
                createdAt: Date;
                mainGDriveLink: string;
            }>,
            currentPage: page,
            totalPages: Math.ceil(totalDistinctRunIds / limit),
            totalItems: totalDistinctRunIds,
        };

        resp.json(results);
    } catch (error: any) {
        console.log(`/gDriveRenamingHistoryGroupedByRunId error: ${JSON.stringify(error.message)}`);
        resp.status(500).json({ message: "Error fetching gDriveCpRenameHistory grouped by runId", error })
    }
})
