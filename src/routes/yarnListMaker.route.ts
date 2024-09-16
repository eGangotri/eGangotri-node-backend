.import path from 'path';
import * as express from 'express';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { pickLatestExcelsAndCombineGDriveAndReducedPdfExcels } from '../services/yarnListMakerService';
import { extractFirstAndLastNPages } from '../cliBased/pdf/extractFirstAndLastNPages';
import { gDriveExceltoMongo } from '../excelToMongo/tranferGDriveExcelToMongo';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { publishBookTitlesList } from '../services/yarnService';
import { PDF_TYPE, ZIP_TYPE } from '../cliBased/googleapi/_utils/constants';

export const yarnListMakerRoute = express.Router();

yarnListMakerRoute.post('/getGoogleDriveListing', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListing ${JSON.stringify(req.body)}`)
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        const ignoreFolder = req?.body?.ignoreFolder
        const allNotJustPdfs = req?.body?.allNotJustPdfs || false;

        console.log(`getGoogleDriveListing googleDriveLink:
         ${googleDriveLink}/${folderName}/${reduced}/${ignoreFolder}/${allNotJustPdfs}`)
        if (!googleDriveLink || !folderName) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide google drive Link"
                }
            });
            return
        }
        if (folderName.includes(path.sep)) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Folder Name cannot have path separators"
                }
            });
            return
        }

        const _links = []
        const _folders = [];
        if (googleDriveLink.includes(",") || folderName.includes(",")) {
            const links = googleDriveLink.split(",").map((link: string) => {
                return link.trim()
            })
            _links.push(...links);
            const folders = folderName.split(",").map((folder: string) => {
                return folder.trim()
            })
            _folders.push(...folders);
            if (_links.length != _folders.length) {
                console.log(`eror- links and folder counts diff`)
                resp.status(300).send({
                    response: {
                        "status": "failed",
                        "success": false,
                        "message": "Number of Links and Folder Names should match"
                    }
                });
                return
            }

        }
        else {
            _links.push(googleDriveLink.trim());
            _folders.push(folderName.trim());
        }

        const _resps = [];
        for (let i = 0; i < _links.length; i++) {
            console.log(`getGoogleDriveListing ${_links[i]} ${_folders[i]} (${allNotJustPdfs})`)
            const listingResult = await generateGoogleDriveListingExcel(_links[i], 
                _folders[i], reduced,
                 ignoreFolder,
                 allNotJustPdfs?"":PDF_TYPE);
            _resps.push(listingResult);
        }

        resp.status(200).send({
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
