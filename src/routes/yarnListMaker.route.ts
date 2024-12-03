import * as express from 'express';
import { pickLatestExcelsAndCombineGDriveAndReducedPdfExcels } from '../services/yarnListMakerService';
import { extractFirstAndLastNPages } from '../cliBased/pdf/extractFirstAndLastNPages';
import { gDriveExceltoMongo } from '../excelToMongo/tranferGDriveExcelToMongo';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { publishBookTitlesList } from '../services/yarnService';

export const yarnListMakerRoute = express.Router();

yarnListMakerRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        const destRootFolder = req?.body?.destRootFolder;
        const nPages = Number(req?.body?.nPages || 10);
        const _srcFolders: string[] = srcFoldersAsCSV.split(',').map((x:string)=>x.trim());
        console.log(`getFirstAndLastNPages _folders ${_srcFolders} 
        destRootFolder ${destRootFolder}
        req?.body?.nPages ${nPages}`)

        if (!srcFoldersAsCSV || !srcFoldersAsCSV) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Src Folder and Dest Folder"
                }
            });
            return;
        }
        let timeNow = Date.now();
        const _resp = await extractFirstAndLastNPages(_srcFolders, destRootFolder, nPages);
        resp.status(200).send({
            response: {
                timeTaken: timeInfo(Date.now() - timeNow),
                _results: _resp
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnListMakerRoute.post('/combineGDriveAndReducedPdfExcels', async (req: any, resp: any) => {
    try {
        const mainExcelPath = req?.body?.mainExcelPath;
        const secondaryExcelPath = req?.body?.secondaryExcelPath;
        const destExcelPath = req?.body?.destExcelPath || undefined;

        console.log(`combineGDriveAndReducedPdfExcels
         mainExcelPath ${mainExcelPath} 
        secondaryExcelPath ${secondaryExcelPath}
        destExcelPath ${destExcelPath}
        `)

        if (!mainExcelPath || !secondaryExcelPath) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Main/Secondary Excel Path"
                }
            });
            return;
        }
        const _resp = pickLatestExcelsAndCombineGDriveAndReducedPdfExcels(mainExcelPath, secondaryExcelPath, destExcelPath);
        resp.status(200).send({
            response: {
                _results: _resp
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnListMakerRoute.post('/dumpGDriveExcelToMongo', async (req: any, resp: any) => {
    try {
        const comboExcelPath = req?.body?.comboExcelPath;
        const folderName = req?.body?.folderName;

        console.log(`combineGDriveAndReducedPdfExcels
        comboExcelPath ${comboExcelPath} 
        folderName ${folderName}
        `)

        if (!comboExcelPath) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Combo Excel Path"
                }
            });
            return;
        }
        const _resp = await gDriveExceltoMongo(comboExcelPath);
        resp.status(200).send({
            response: {
                _results: _resp
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnListMakerRoute.post('/createListingsOfLocalFolder', async (req: any, resp: any) => {
    try {
        const argFirst = req.body.argFirst
        const pdfsOnly = req.body.pdfsOnly
        const onlyInfoNoExcel = req.body.onlyInfoNoExcel || false
        const withStats = req.body.withStats || false
        console.log(`/createListingsOfLocalFolder argFirst ${argFirst} 
        pdfsOnly ${pdfsOnly} 
        onlyInfoNoExcel ${onlyInfoNoExcel}
        withStats ${withStats}`);

        let timeNow = Date.now();
        const res = await publishBookTitlesList(argFirst,
            {
                withStats,
                pdfsOnly,
                onlyInfoNoExcel: onlyInfoNoExcel
            }
        );
        resp.status(200).send({
            timeTaken: timeInfo(Date.now() - timeNow),
            ...res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})
