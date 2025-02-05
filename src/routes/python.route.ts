import * as express from 'express';
import { makePythonCall } from '../services/pythonLauncherService';
import { countPDFsInFolder } from '../utils/FileUtils';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import { getAllFileStats } from '../utils/FileStatsUtils';
import { PDF_EXT } from '../imgToPdf/utils/constants';

export const pythonRoute = express.Router();

pythonRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        const destRootFolder = req?.body?.destRootFolder;
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
        console.log(`getFirstAndLastNPages _folders ${_srcFolders} 
        destRootFolder ${destRootFolder}
        req?.body?.nPages ${nPages}`)

        if (!srcFoldersAsCSV) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }

        const pdfCount = await countPDFsInFolder(_srcFolders[0], "reduced");
        const _resp = await makePythonCall(_srcFolders[0], firstNPages, firstNPages);
            
        if(_resp.success){ 
            const pdfsReduced = await countPDFsInFolder(`${_srcFolders[0]}//reduced`);
            resp.status(200).send({
                response: {
                    forReduction: pdfCount,
                    pdfsReduced,
                    isReductionCountMatch: pdfCount === pdfsReduced,
                    _results: _resp,
                }
            });
        }
        else{
            resp.status(500).send({
                response: {
                    forReduction: pdfCount,
                    _results: _resp
                }
            });
        }
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
