import express from 'express';
import * as fs from 'fs';
import { getAllFileListingWithFileSizeStats, getAllFoldersWithPdfCount } from '../utils/FileStatsUtils';
import { FileStats, FolderStats } from 'imgToPdf/utils/types';
import { getNumericInBraces } from './utils';

export const folderUtilsRoute = express.Router();



folderUtilsRoute.get('/findFolderWithPdfCount', async (req: any, resp: any) => {
    try {
        const folder = req.query.folder;
        console.log(`folder: ${folder}`);

        const metadata: Record<string, FileStats[]> = await getAllFoldersWithPdfCount(folder);
        const metaDataWithCount: FolderStats[] = Object.keys(metadata).map((key: string) => {
            const pdfCount = metadata[key].length;
            const folder = key;
            const numericInBraces = getNumericInBraces(folder);
            const countMatch = numericInBraces === pdfCount;
            return {
                folder,
                pdfCount,
                countMatch,
                meta: metadata[key],
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
