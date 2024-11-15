import * as express from 'express';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { genLinksAndFolders, pickLatestExcelsAndCombineGDriveAndReducedPdfExcels, validateGenGDriveLinks } from '../services/yarnListMakerService';
import { extractFirstAndLastNPages } from '../cliBased/pdf/extractFirstAndLastNPages';
import { gDriveExceltoMongo } from '../excelToMongo/tranferGDriveExcelToMongo';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { publishBookTitlesList } from '../services/yarnService';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';

export const yarnListMakerRoute = express.Router();

yarnListMakerRoute.post('/getGoogleDriveListingAsExcel', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListingAsExcel ${JSON.stringify(req.body)}`)
    const startTime = Date.now();

    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        const ignoreFolder = req?.body?.ignoreFolder
        const allNotJustPdfs = req?.body?.allNotJustPdfs || false;
        const pdfRenamerXlV2 = req?.body?.pdfRenamerXlV2 || false;

        console.log(`getGoogleDriveListingAsExcel googleDriveLink:
         ${googleDriveLink}/${folderName}/${reduced}/${ignoreFolder}/${allNotJustPdfs}/${pdfRenamerXlV2}`)

        const _validations = validateGenGDriveLinks(googleDriveLink, folderName)
        if (_validations.success === false) {
            resp.status(300).send({
                response: _validations
            })
        }

        const { _links, _folders, error } = genLinksAndFolders(googleDriveLink, folderName)
        if (error) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Number of Links and Folder Names should match"
                }
            });
            return
        }

        const _resps = [];
        for (let i = 0; i < _links.length; i++) {
            console.log(`getGoogleDriveListingAsExcel ${_links[i]} ${_folders[i]} (${allNotJustPdfs})`)
            const listingResult = await generateGoogleDriveListingExcel(_links[i],
                _folders[i], reduced,
                ignoreFolder,
                pdfRenamerXlV2,
                allNotJustPdfs ? "" : PDF_TYPE);
            _resps.push(listingResult);
        }
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download google drive Listings: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            response: {
                reduced: reduced ? "Yes" : "No",
                allNotJustPdfs: allNotJustPdfs ? "Yes" : "No",
                ..._resps,
            }
        });
        return;
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnListMakerRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        const destRootFolder = req?.body?.destRootFolder;
        const nPages = Number(req?.body?.nPages || 10);
        const _srcFolders: string[] = srcFoldersAsCSV.split(',');
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
        const _resp = await extractFirstAndLastNPages(_srcFolders, destRootFolder, nPages);
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
