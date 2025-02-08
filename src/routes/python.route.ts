import * as express from 'express';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import { runPthonPdfExtractionInLoop } from '../services/pythonCLIService';

export const pythonRoute = express.Router();

pythonRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        let destRootFolder = req?.body?.destRootFolder;
        const nPages = req?.body?.nPages || DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let firstNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;
        let lastNPages = DEFAULT_PDF_PAGE_EXTRACTION_COUNT;

        if (!isNaN(nPages)) {
            firstNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
            lastNPages = nPages <= 0 ? DEFAULT_PDF_PAGE_EXTRACTION_COUNT : nPages;
        } else {
            if (nPages?.trim().includes('-')) {
                const [start, end] = nPages.split('-').map((x: string) => parseInt(x?.trim()));
                firstNPages = start;
                lastNPages = end;
            } else {
                firstNPages = parseInt(nPages?.trim());
                lastNPages = parseInt(nPages?.trim());
            }
        }
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x: string) => x.trim());
        console.log(`getFirstAndLastNPages _folders(${_srcFolders.length}) ${_srcFolders} 
        destRootFolder ${destRootFolder}
        ${firstNPages}/${lastNPages}`)

        if (!srcFoldersAsCSV || !destRootFolder) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        const combinedResults = await runPthonPdfExtractionInLoop(_srcFolders, destRootFolder, firstNPages, lastNPages);
        const stats = combinedResults.filter((x:{success:boolean}) => x.success === true).length;
        console.log(`combinedResults extractFirstN: ${stats} of ${combinedResults.length} processed successfully`);
        resp.status(200).send({
            response : {
                successes: stats === combinedResults.length,
                _cumulativeMsg: `${stats} of ${combinedResults.length} processed successfully`,
                ...combinedResults,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
