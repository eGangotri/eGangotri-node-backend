import express from 'express';
import * as fs from 'fs';
import { getAllFileListingWithFileSizeStats, getAllFoldersWithPdfCount } from '../utils/FileStatsUtils';
import { FileStats } from 'imgToPdf/utils/types';

export const folderUtilsRoute = express.Router();



folderUtilsRoute.get('/findFolderWithPdfCount', async (req: any, resp: any) => {
    try {
        const folder = req.query.folder;
        console.log(`folder: ${folder}`);

        const metadata: Record<string, FileStats[]> = await getAllFoldersWithPdfCount(folder);
        const metaDataWithCount = Object.keys(metadata).map((key: string) => {
            return {
                folder: key,
                meta: metadata[key],
                pdfCount: metadata[key].length
            }
        })

        
        resp.status(200).send({
            response: metaDataWithCount
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
