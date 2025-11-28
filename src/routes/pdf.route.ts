import * as express from 'express';
import PdfPageExtractionHistory, { IPdfPageExtractionHistory } from '../models/PdfPageExtractionHistory';
import PdfPageExtractionPerItemHistory, { IPdfPageExtractionPerItemHistory } from '../models/PdfPageExtractionPerItemHistory';

export const pdfRoute = express.Router();

pdfRoute.get('/getFirstLastPagesPdfPerItemHistory', async (req: any, resp: any) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const pdfExtractionLogs: IPdfPageExtractionPerItemHistory[] = await PdfPageExtractionPerItemHistory.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfPageExtractionPerItemHistory.countDocuments();

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


pdfRoute.get('/getFirstLastPagesItemHistory', async (req: any, resp: any) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const pdfExtractionLogs: IPdfPageExtractionHistory[] = await PdfPageExtractionHistory.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PdfPageExtractionHistory.countDocuments();

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
