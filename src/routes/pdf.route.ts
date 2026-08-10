import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import PdfPageExtractionHistory, { IPdfPageExtractionHistory } from '../models/PdfPageExtractionHistory';
import PdfPageExtractionPerItemHistory, { IPdfPageExtractionPerItemHistory } from '../models/PdfPageExtractionPerItemHistory';
const execFileAsync = promisify(execFile);

export const pdfRoute = express.Router();


pdfRoute.get('/getPageExtractionHistory', async (req: any, resp: any) => {
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

pdfRoute.get('/getPageExtractionPerItemHistory', async (req: any, resp: any) => {
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


pdfRoute.get('/getPageExtractionPerItemHistory/:commonRunId', async (req: any, resp: any) => {
    try {
       const commonRunId = req.params.commonRunId;
       const pdfExtractionLogs: IPdfPageExtractionPerItemHistory[] = await PdfPageExtractionPerItemHistory.find({ commonRunId })
           .sort({ createdAt: -1 });
       resp.json(pdfExtractionLogs);
    } catch (error) {
        console.log(`/getPageExtractionPerItemHistory error: ${JSON.stringify((error as any).message)}`);
        resp.status(500).json({ message: 'Error fetching PdfExtractionLog history', error });
    }
});

pdfRoute.post('/repairPdfs', async (req: any, resp: any) => {
    try {
        const srcFolder = (req.body.srcFolder as string) || '';

        if (!srcFolder || !fs.existsSync(srcFolder) || !fs.statSync(srcFolder).isDirectory()) {
            return resp.status(400).json({ success: false, message: 'A valid folder query parameter is required' });
        }

        const normalizedSrc = srcFolder.replace(/[\\/]+$/, '');
        const outFolder = `${normalizedSrc}-repaired`;

        fs.mkdirSync(outFolder, { recursive: true });

        const entries = fs.readdirSync(normalizedSrc, { withFileTypes: true });
        const pdfFiles = entries.filter(e => e.isFile() && /\.pdf$/i.test(e.name));

        const repaired: any[] = [];
        const errors: any[] = [];

        for (const entry of pdfFiles) {
            const inputPath = path.join(normalizedSrc, entry.name);
            const outputPath = path.join(outFolder, entry.name);

            try {
                const { stdout, stderr } = await execFileAsync('gswin64c', [
                    '-o', outputPath,
                    '-sDEVICE=pdfwrite',
                    '-dPDFSETTINGS=/prepress',
                    inputPath
                ], { maxBuffer: 1024 * 1024 * 10 });

                if (stderr) {
                    console.log(`gswin64c stderr for ${entry.name}: ${stderr}`);
                }

                repaired.push({ input: inputPath, output: outputPath, stdout });
            } catch (err: any) {
                console.error(`Failed to repair ${entry.name}: ${err.message}`);
                errors.push({ input: inputPath, error: err.message });
            }
        }

        resp.status(200).json({
            success: true,
            source: normalizedSrc,
            repairedFolder: outFolder,
            totalProcessed: pdfFiles.length,
            repairedCount: repaired.length,
            failedCount: errors.length,
            repaired,
            errors
        });
    } catch (error: any) {
        console.log(`/repairPdfs error: ${JSON.stringify(error?.message)}`);
        resp.status(500).json({ success: false, message: 'Error repairing PDFs', error });
    }
});

