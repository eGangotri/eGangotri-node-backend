import * as express from 'express';
import { scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { ArchiveDataRetrievalMsg } from '../archiveDotOrg/types';
import { extractFistsAndLastPages } from '../cliBased/pdf/extractFirstAndLastNPages';
import path from 'path';
import { pickLatestExcelsAndCombineGDriveAndReducedPdfExcels } from '../services/yarnListMakerService';

export const launchYarnListMakerRoute = express.Router();

launchYarnListMakerRoute.post('/getGoogleDriveListing', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListing ${JSON.stringify(req.body)}`)
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        const reduced = req?.body?.reduced || false;
        console.log(`getGoogleDriveListing googleDriveLink ${googleDriveLink}/${folderName}/${reduced}`)
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

        const responses = [];
        for (let i = 0; i < _links.length; i++) {
            console.log(`getGoogleDriveListing ${_links[i]} ${_folders[i]}`)
            const listingResult = await generateGoogleDriveListingExcel(_links[i], _folders[i], reduced);
            responses.push(listingResult);
        }

        resp.status(200).send({
            ...responses,
            reduced: reduced ? "Reduced" : "Main"
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchYarnListMakerRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLinks = req?.body?.archiveLinks;
        const onlyLinks = (req?.body?.onlyLinks == true) || false;
        const limitedFields = (req?.body?.limitedFields == true) || false;
        console.log(`getArchiveListing archiveLinks ${archiveLinks} 
        onlyLinks ${onlyLinks}
        req?.body?.limitedFields ${req?.body?.limitedFields}
        req?.body?.limitedFields ${typeof req?.body?.limitedFields}
         limitedFields ${limitedFields}`)

        if (!archiveLinks) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide archive Links. At least one is mandatory"
                }
            });
            return
        }
        const _resp: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLinks, onlyLinks, limitedFields);
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


launchYarnListMakerRoute.post('/getFirstAndLastNPages', async (req: any, resp: any) => {
    try {
        const srcFoldersAsCSV = req?.body?.srcFolders;
        const destRootFolder = req?.body?.destRootFolder;
        const nPages = req?.body?.nPages || 10;
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
        const _resp = await extractFistsAndLastPages(_srcFolders, destRootFolder, nPages);
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


launchYarnListMakerRoute.post('/combineGDriveAndReducedPdfExcels', async (req: any, resp: any) => {
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