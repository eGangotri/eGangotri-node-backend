const express = require("express");
import { Request, Response } from 'express';
import GDriveDownload, { IGDriveDownload } from '../models/GDriveDownloadHistorySchema';

export const gDriveDownloadRoute = express.Router();

gDriveDownloadRoute.post("/createGDriveDownload", async (req: Request, res: Response) => {
    try {
        const { googleDriveLink, profileNameOrAbsPath, downloadType, files, fileDumpFolder,msg } = req.body;
        const newGDriveDownload = new GDriveDownload({
            googleDriveLink,
            profileNameOrAbsPath,
            downloadType,
            files,
            fileDumpFolder,
            msg
        });
        await newGDriveDownload.save();
        console.log(`/createGDriveDownload created: ${JSON.stringify(newGDriveDownload)}`);
        res.status(201).json(newGDriveDownload);
    } catch (error) {
        console.log(`/createGDriveDownload error: ${JSON.stringify(error.message)}`);
        res.status(500).json({ error: error.message });
    }
});

// Update the main schema of an existing GDriveDownload entry
gDriveDownloadRoute.post("/updateGDriveDownload/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, msg , quickStatus} = req.body;
    try {
        console.log(`updateGDriveDownload:params: ${id} ${status} ${msg}`);
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            console.log(`updateGDriveDownload/${id}:GDriveDownload not found`);
            res.status(404).json({ error: 'GDriveDownload not found' });
        }

        else {
            if (status !== undefined) {
                gDriveDownload.status = status;
            }
            if (msg !== undefined) {
                gDriveDownload.msg = msg + "," + gDriveDownload.msg;
            }
            if(quickStatus !== undefined) {
                gDriveDownload.quickStatus = quickStatus;
            }
            const updatedGDriveDownload = await gDriveDownload.save();
            console.log(`updateGDriveDownload:updatedGDriveDownload/${id}: ${JSON.stringify(updatedGDriveDownload)}`);
            if (!updatedGDriveDownload) {
                console.log(`updateGDriveDownload:GDriveDownload not found`);
                res.status(404).json({ error: 'GDriveDownload not found' });
                return;
            }
            res.status(200).json(updatedGDriveDownload);
        }
    } catch (error) {
        console.log(`updateGDriveDownload/${id}:error ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Update an embedded object in the files array of an existing GDriveDownload entry by fileName
gDriveDownloadRoute.post("/updateEmbeddedFileByFileName/1:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fileName, status, msg, filePath } = req.body;
    try {
        console.log(`updateEmbeddedFileByFileName/2/${id}: ${fileName} ${filePath} ${id} ${status} ${msg}`);
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            console.log(`updateEmbeddedFileByFileName/3/${id}:GDriveDownload not found`);
            res.status(404).json({ error: 'GDriveDownload not found' });
            return;
        }
        const file = gDriveDownload.files.find(file => file.fileName === fileName);
        if (!file) {
            const existingFiles = gDriveDownload.files;
            const updateData: any = {};
            if (status !== undefined) updateData.status = status;
            if (msg !== undefined) updateData.msg = msg;
            if (fileName !== undefined) updateData.fileName = fileName;
            if (filePath !== undefined) updateData.filePath = filePath;
            existingFiles.push(updateData);
            gDriveDownload.files = existingFiles;
            const _saved = await gDriveDownload.save();
            console.log(`updateEmbeddedFileByFileName/4/${id}: file not found, added ${fileName} ${JSON.stringify(_saved)}`);
            res.status(200).json(gDriveDownload);
        }
        else {
            if (status !== undefined) file.status = status;
            if (msg !== undefined) file.msg = msg;
            const _saved = await gDriveDownload.save();
            console.log(`updateEmbeddedFileByFileName/5/${id}:file updated ${fileName}`);
            res.status(200).json(gDriveDownload);
        }
    } catch (error) {
        console.log(`updateEmbeddedFileByFileName/6/${id}: ${fileName} error ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all GDriveDownload entries
gDriveDownloadRoute.get("/getGDriveDownloads", async (req: Request, res: Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        const gdriveDownloads: IGDriveDownload[] = await GDriveDownload.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(100);

        const total = await GDriveDownload.countDocuments()
        const results = {
            data: gdriveDownloads,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        }
        res.json(results)
    } catch (error) {
        console.log(`/getGDriveDownloads error: ${JSON.stringify(error.message)}`);
        res.status(500).json({ message: "Error fetching GDrive downloads", error })
    }
});