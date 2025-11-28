import * as express from 'express';
import PdfExtractionLog, { IPdfExtractionLog } from '../models/PdfExtractionLog';

export const pdfRoute = express.Router();

pdfRoute.post('/getFirstLastPagesPdfHistory', async (req: any, resp: any) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const pdfExtractionLogs: IPdfExtractionLog[] = await PdfExtractionLog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfExtractionLog.countDocuments();

        const results = {
            data: pdfExtractionLogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        };

        resp.json(results);
    } catch (error) {
        console.log(`/getFirstLastPagesPdfHistory error: ${JSON.stringify((error as any).message)}`);
        resp.status(500).json({ message: 'Error fetching PdfExtractionLog history', error });
    }
});
