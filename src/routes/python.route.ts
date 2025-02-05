import * as express from 'express';
import { pickLatestExcelsAndCombineGDriveAndReducedPdfExcels } from '../services/yarnListMakerService';
import { gDriveExceltoMongo } from '../excelToMongo/tranferGDriveExcelToMongo';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { publishBookTitlesList } from '../services/yarnService';
import { makePythonCall } from '../services/pythonLauncherService';
import { countPDFsInFolder } from '../utils/FileUtils';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from 'cliBased/pdf/extractFirstAndLastNPages';

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

        const _resp = await makePythonCall(_srcFolders[0], firstNPages, firstNPages);
        if(_resp.success){ 
            const pdfsReduced = await countPDFsInFolder(`${_srcFolders[0]}//reduced`);
            resp.status(200).send({
                response: {
                    timeTaken: timeInfo(_resp.timeTaken),
                    _results: _resp,
                    pdfsReduced
                }
            });
            
        }
        else{
            resp.status(500).send({
                response: {
                    timeTaken: timeInfo(_resp.timeTaken),
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
