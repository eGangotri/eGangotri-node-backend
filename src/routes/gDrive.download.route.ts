const express = require("express");
import { Request, Response } from 'express';
import GDriveDownload, { IGDriveDownload } from '../models/GDriveDownloadHistorySchema';
import { refreshGdriveToken } from '../cliBased/googleapi/_utils/getRefreshToken';

export const gDriveDownloadRoute = express.Router();

gDriveDownloadRoute.post("/createGDriveDownload", async (req: Request, res: Response) => {
    try {
        const { googleDriveLink, profileNameOrAbsPath, downloadType, files, fileDumpFolder, gDriveRootFolder, msg, runId, commonRunId } = req.body;
        const newGDriveDownload = new GDriveDownload({
            googleDriveLink,
            profileNameOrAbsPath,
            downloadType,
            files,
            fileDumpFolder,
            gDriveRootFolder,
            msg,
            runId,
            commonRunId
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
        console.log(`updateGDriveDownload:params: ${id} ${status} ${msg} ${quickStatus||'quickStatus-NA'}`);
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


// Update the main schema of an existing GDriveDownload entry
gDriveDownloadRoute.post("/markVerificationGDriveDownload/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { verify} = req.body;
    try {
        console.log(`markVerificationGDriveDownload:params: ${id} ${verify}`);
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            console.log(`markVerificationGDriveDownload/${id}:GDriveDownload not found`);
            res.status(404).json({ error: 'GDriveDownload not found' });
        }

        else {
            if (verify !== undefined) {
                gDriveDownload.verify = verify;
            }
           
            const updatedGDriveDownload = await gDriveDownload.save();
            console.log(`markVerificationGDriveDownload:updatedGDriveDownload/${id}: ${JSON.stringify(updatedGDriveDownload)}`);
            if (!updatedGDriveDownload) {
                console.log(`markVerificationGDriveDownload:GDriveDownload not found`);
                res.status(404).json({ error: 'GDriveDownload not found' });
                return;
            }
            res.status(200).json(updatedGDriveDownload);
        }
    } catch (error) {
        console.log(`markVerificationGDriveDownload/${id}:error ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Update an embedded object in the files array of an existing GDriveDownload entry by fileName
gDriveDownloadRoute.post("/updateEmbeddedFileByFileNameV2/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fileName, status, msg, filePath } = req.body;
    try {
        console.log(`updateEmbeddedFileByFileName/1/${id}: ${fileName} ${filePath} ${id} ${status} ${msg}`);
        
        // Find the document first to check if the file exists
        const gDriveDownload = await GDriveDownload.findById(id);
        if (!gDriveDownload) {
            console.log(`updateEmbeddedFileByFileName/2/${id}:GDriveDownload not found`);
            res.status(404).json({ error: 'GDriveDownload not found' });
            return;
        }
        
        // Check if the file exists in the files array
        const fileExists = gDriveDownload.files.some(file => file.fileName === fileName);
        let updateResult;
        
        if (!fileExists) {
            // If file doesn't exist, push a new file to the files array
            const updateData: any = {};
            if (status !== undefined) updateData.status = status;
            if (msg !== undefined) updateData.msg = msg;
            if (fileName !== undefined) updateData.fileName = fileName;
            if (filePath !== undefined) updateData.filePath = filePath;
            
            // Use findOneAndUpdate with $push to add the new file atomically
            updateResult = await GDriveDownload.findOneAndUpdate(
                { _id: id },
                { $push: { files: updateData } },
                { new: true, runValidators: true }
            );
            
            if (updateResult) {
                console.log(`updateEmbeddedFileByFileName/3/${id}: file not found, added ${fileName}`);
                res.status(200).json(updateResult);
            } else {
                console.log(`updateEmbeddedFileByFileName/3.1/${id}: update failed for ${fileName}`);
                res.status(500).json({ error: 'Update failed' });
            }
        } else {
            // If file exists, update the existing file in the array
            // Use findOneAndUpdate with $set to update the file atomically
            updateResult = await GDriveDownload.findOneAndUpdate(
                { _id: id, "files.fileName": fileName },
                { 
                    $set: { 
                        "files.$.status": status !== undefined ? status : gDriveDownload.files.find(f => f.fileName === fileName)?.status,
                        "files.$.msg": msg !== undefined ? msg : gDriveDownload.files.find(f => f.fileName === fileName)?.msg
                    } 
                },
                { new: true, runValidators: true }
            );
            
            if (updateResult) {
                console.log(`updateEmbeddedFileByFileName/4/${id}: file updated ${fileName}`);
                res.status(200).json(updateResult);
            } else {
                console.log(`updateEmbeddedFileByFileName/4.1/${id}: update failed for ${fileName}`);
                res.status(500).json({ error: 'Update failed' });
            }
        }
    } catch (error) {
        console.log(`updateEmbeddedFileByFileName/5/${id}: ${fileName} error ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Get all GDriveDownload entries
gDriveDownloadRoute.get("/getGDriveDownloads", async (req: Request, res: Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1
        const limit = Number.parseInt(req.query.limit as string) || 20
        const skip = (page - 1) * limit

        const gdriveDownloads: IGDriveDownload[] = await GDriveDownload.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

gDriveDownloadRoute.get("/refreshToken", async (req: Request, res: Response) => {
    try {
        const refreshToken = await refreshGdriveToken();
        res.json({ refreshToken });
    } catch (error) {
        console.log(`/refreshToken/error ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});
 
