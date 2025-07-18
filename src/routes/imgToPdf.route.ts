import express, { Request, Response } from "express";
import { ImageToPdfHistory } from "../models/ImageToPdfHistorySchema";

export const imgToPdfRoute = express.Router();

imgToPdfRoute.post("/createImgToPdfEntry", async (req: Request, resp: Response) => {
    try {
        const doc = new ImageToPdfHistory(req.body);
        const savedDoc = await doc.save();
        resp.json({ id: savedDoc._id });
    } catch (error) {
        console.error('Error creating ImageToPdfHistory:', error);
        resp.status(500).json({ error: 'Failed to create ImageToPdfHistory entry' });
    }
});

imgToPdfRoute.post("/getAllImgToPdfEntries", async (req: Request, resp: Response) => {
    try {
        const docs = await ImageToPdfHistory.find({}).sort({ created_at: -1 });
        resp.json({ entries: docs, totalItems: docs?.length || 0});
    } catch (error) {
        console.error('Error fetching ImageToPdfHistory entries:', error);
        resp.status(500).json({ error: 'Failed to fetch ImageToPdfHistory entries' });
    }
});


imgToPdfRoute.post("/updateImgToPdfEntry", async (req: Request, resp: Response) => {
    try {
        const { id, report } = req.body;
        
        const updatedDoc = await ImageToPdfHistory.findByIdAndUpdate(
            id,
            {
                total_folders: report.total_folders,
                folders_detail: report.folders_detail,
                summary: report.summary,
                memory_stats: report.memory_stats,
                paths: report.paths
            },
            { new: true }
        );

        if (!updatedDoc) {
            return resp.status(404).json({ error: 'Document not found' });
        }

        resp.json({ success: true, id: updatedDoc._id });
    } catch (error) {
        console.error('Error updating ImageToPdfHistory:', error);
        resp.status(500).json({ error: 'Failed to update ImageToPdfHistory entry' });
    }
});
