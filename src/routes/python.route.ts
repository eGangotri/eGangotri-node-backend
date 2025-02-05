import * as express from 'express';
import { makePythonCall } from '../services/pythonLauncherService';
import { countPDFsInFolder } from '../utils/FileUtils';
import { DEFAULT_PDF_PAGE_EXTRACTION_COUNT } from '../cliBased/pdf/extractFirstAndLastNPages';
import fs from 'fs';

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
        console.log(`getFirstAndLastNPages _folders ${srcFoldersAsCSV} firstNPages${firstNPages} lastNPages${lastNPages}`)
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

        const pdfsToReduceCount = await countPDFsInFolder(_srcFolders[0], "reduced");
        if (!fs.existsSync(destRootFolder)) {
            destRootFolder = `${_srcFolders[0]}\\reduced`;
        }
        const _resp = await makePythonCall(_srcFolders[0], destRootFolder, firstNPages, firstNPages);
        if (_resp.success) {
            const pdfsReducedCount = await countPDFsInFolder(`${destRootFolder}`);
            const result = {
                response: {
                    msg: `${pdfsToReduceCount} pdfs processed to ${pdfsReducedCount} with first ${firstNPages} and last ${lastNPages} pages`,
                    _srcFolders: _srcFolders[0],
                    destRootFolder: destRootFolder,
                    isReductionCountMatch: pdfsToReduceCount === pdfsReducedCount,
                    _results: _resp,
                }
            }
            console.log('result', result);
            resp.status(200).send(result);
        }
        else {
            resp.status(500).send({
                response: {
                    forReduction: pdfsToReduceCount,
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
