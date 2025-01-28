const express = require("express");
import { Request, Response } from 'express';
import GDriveDownload from '../models/GDriveDownloadSchema';

export const gDriveDownloadRoute = express.Router();

gDriveDownloadRoute.post("/createGDriveDownload", async (req: Request, res: Response) => {
    try {
        const { googleDriveLink, profileNameOrAbsPath, downloadType, files, fileDumpFolder } = req.body;
        const newGDriveDownload = new GDriveDownload({
            googleDriveLink,
            profileNameOrAbsPath,
            downloadType,
            files,
            fileDumpFolder
        });
        await newGDriveDownload.save();
        res.status(201).json(newGDriveDownload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update the main schema of an existing GDriveDownload entry
gDriveDownloadRoute.post("/updateGDriveDownload", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, msg } = req.body;
        // Build the update object dynamically
        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (msg !== undefined) updateData.msg = msg;
        const updatedGDriveDownload = await GDriveDownload.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        if (!updatedGDriveDownload) {
            res.status(404).json({ error: 'GDriveDownload not found' });
            return;
        }
        res.status(200).json(updatedGDriveDownload);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an embedded object in the files array of an existing GDriveDownload entry by fileName
gDriveDownloadRoute.post("/updateEmbeddedFileByFileName", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fileName, status, msg } = req.body;
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            res.status(404).json({ error: 'GDriveDownload not found' });
            return;
        }
        const file = gDriveDownload.files.find(file => file.fileName === fileName);
        if (!file) {
            const existingFiles = gDriveDownload.files;
            existingFiles.push({ fileName, filePath: '', status, msg });
            gDriveDownload.files = existingFiles;
            await gDriveDownload.save();
            res.status(200).json(gDriveDownload);
        }
        else {
            file.status = status;
            file.msg = msg;
            await gDriveDownload.save();
            res.status(200).json(gDriveDownload);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all GDriveDownload entries
gDriveDownloadRoute.post("/getGDriveDownloads", async (req: Request, res: Response) => {
    try {
        const GDriveDownloads = await GDriveDownload.find();
        res.status(200).json(GDriveDownloads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});