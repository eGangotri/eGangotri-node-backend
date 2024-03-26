import * as express from 'express';
import { downloadPdfFromGoogleDriveToProfile } from '../cliBased/googleapi/GoogleDriveApiReadAndDownload';
import { scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import * as fs from 'fs';
import { generateGoogleDriveListingExcel } from '../cliBased/googleapi/GoogleDriveApiReadAndExport';
import { getFolderInSrcRootForProfile } from '../cliBased/utils';
import { moveFileSrcToDest, moveProfilesToFreeze } from '../services/yarnService';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { ARCHIVE_EXCEL_PATH } from '../archiveDotOrg/utils';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { vanitizePdfForProfile } from '../vanityService/VanityPdf';
import { isValidPath } from '../utils/utils';
import { moveToFreeze } from 'services/gradleLauncherService';
export const launchYarnRoute = express.Router();

launchYarnRoute.post('/downloadFromGoogleDrive', async (req: any, resp: any) => {
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const profile = req?.body?.profile;
        console.log(`:downloadFromGoogleDrive:
        googleDriveLink:
         ${googleDriveLink?.split(",").map((link: string) => link + "\n ")} 
        profile ${profile}`)
        if (!googleDriveLink || !profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "googleDriveLink and profile are mandatory"
                }
            });
        }
        const results = [];
        const links = googleDriveLink.includes(",") ? googleDriveLink.split(",").map((link: string) => link.trim()) : [googleDriveLink.trim()];
        resetDownloadCounters();
        for (const [index, link] of links.entries()) {
            const res = await downloadPdfFromGoogleDriveToProfile(link, profile);
            results.push(res);
        }
        resp.status(200).send({
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchYarnRoute.post('/getGoogleDriveListing', async (req: any, resp: any) => {
    console.log(`getGoogleDriveListing ${JSON.stringify(req.body)}`)
    try {
        const googleDriveLink = req?.body?.googleDriveLink;
        const folderName = req?.body?.folderName || "";
        console.log(`getGoogleDriveListing googleDriveLink ${googleDriveLink} `)
        if (!googleDriveLink) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide google drive Link"
                }
            });
        }
        const listingResult = await generateGoogleDriveListingExcel(googleDriveLink, folderName);
        resp.status(200).send({
            response: {
                ...listingResult
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
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
        }
        const _resp = await scrapeArchiveOrgProfiles(archiveLinks, onlyLinks, limitedFields);
        resp.status(200).send({
            response: {
                "success": true,
                "msg": "Excels created",
                _results: _resp
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchYarnRoute.post('/downloadArchivePdfs', async (req: any, resp: any) => {
    try {
        const archiveLink = req?.body?.archiveLink;
        const profile = req?.body?.profile;

        if (!archiveLink || !profile) {
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Archive Link(s) and profile. Both are mandatory"
                }
            });
        }
        const _archiveScrappedData: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLink, true);

        const scrapedLinks: ArchiveDataRetrievalStatus[] = _archiveScrappedData.scrapedMetadata
        const results = []
        resetDownloadCounters();
        for (const entry of scrapedLinks) {
            if (entry.success == false) {
                results.push({
                    "status": "failed",
                    "error": entry.error,
                    "success": false,
                    msg: `Failed for ${entry.archiveAcctName}`,

                });
                continue;
            }
            const res = await downloadPdfFromArchiveToProfile(entry.links, profile);
            results.push(res);
        }
        resp.status(200).send({
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchYarnRoute.post('/qaToDestFileMover', async (req: any, resp: any) => {
    console.log(`qaToDestFileMover ${JSON.stringify(req.body)}`)
    try {
        const qaPath = req?.body?.qaPath;
        const dest = req?.body?.dest || "";
        const flatten = req?.body?.flatten === "false" ? false : true;

        console.log(`qaToDestFileMover qaPath ${qaPath} for folder(${dest})`)
        if (!qaPath && !dest) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Src and Dest Items"
                }
            });
        }
        const listingResult = await moveFileSrcToDest(qaPath, dest, flatten);
        resp.status(200).send({
            response: {
                ...listingResult
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchYarnRoute.post('/yarnMoveProfilesToFreeze', async (req: any, resp: any) => {
    console.log(`moveProfilesToFreeze ${JSON.stringify(req.body)}`)
    try {
        const profileAsCSV = req?.body?.profileAsCSV;
        const flatten = req?.body?.flatten === "false" ? false : true;

        if (!profileAsCSV) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Profile"
                }
            });
        }
        const _response = await moveProfilesToFreeze(profileAsCSV, flatten);
        resp.status(200).send(_response);
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchYarnRoute.post('/addHeaderFooter', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;

        if (!profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide profile. it is mandatory"
                }
            });
        }
        const pdfDumpFolder = getFolderInSrcRootForProfile(profile)

        resp.status(200).send({
            response: {
                msg: `Request Recieved. Excel file will be created in folder ${ARCHIVE_EXCEL_PATH} in few minutes`,
                "success": true,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchYarnRoute.post('/vanitizePdfs', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;
        if (!profile) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "message": "profile is mandatory"
                }
            });
        }
        const res = await vanitizePdfForProfile(profile);
        resp.status(200).send({
            response: res
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})