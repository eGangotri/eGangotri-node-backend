import * as express from 'express';
import { scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { archiveExceltoMongo } from '../excelToMongo/transferArchiveExcelToMongo';
import { downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { validateDateRange } from '../services/yarnArchiveService';

export const launchArchiveYarnRoute = express.Router();

launchArchiveYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLinks = req?.body?.archiveLinks;
        const onlyLinks = (req?.body?.onlyLinks == true) || false;
        const limitedFields = (req?.body?.limitedFields == true) || false;
        const dateRange = req?.body?.dateRange; //dateRange:"2024/04/01-2024/04/31"
        let parsedDateRange: [number, number] = [0, 0]
        const _validateDates = validateDateRange(dateRange);
        if (_validateDates.success) {
            parsedDateRange  = _validateDates.parsedDateRange;
        }
        else {
            return resp.status(300).send({
                response: {
                    ..._validateDates
                }
            });
        }
        console.log(`getArchiveListing archiveLinks ${archiveLinks} 
        onlyLinks ${onlyLinks}
        req?.body?.limitedFields ${typeof req?.body?.limitedFields}
        dateRange ${dateRange}`)

        if (!archiveLinks) {
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide archive Links. At least one is mandatory"
                }
            });
        }
        const _resp: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLinks, onlyLinks, limitedFields, parsedDateRange);
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


launchArchiveYarnRoute.post('/downloadArchivePdfs', async (req: any, resp: any) => {
    try {
        const startTime = Date.now();
        const archiveLink = req?.body?.archiveLink;
        const profileOrPath = req?.body?.profile;
        const dateRange = req?.body?.dateRange;//dateRange:"2024/04/01-2024/04/31"



        if (!archiveLink || !profileOrPath) {
            return resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Archive Link(s) and profile. Both are mandatory"
                }
            });
        }
        const _archiveScrappedData: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLink, true, dateRange);

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
            const res = await downloadPdfFromArchiveToProfile(entry.archiveReport.linkData, profileOrPath);
            results.push(res);
        }

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download downloadArchivePdfs: ${timeTaken} ms`);
        resp.status(200).send({
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

//untested
launchArchiveYarnRoute.post('/dumpArchiveExcelToMongo', async (req: any, resp: any) => {
    try {
        const archiveExcelPath = req?.body?.archiveExcelPath;
        console.log(`dumpArchiveExcelToMongo
        comboExcelPath ${archiveExcelPath} 
        `)

        if (!archiveExcelPath) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Archive Excel Path and Folder Name"
                }
            });
            return;
        }
        const _resp = archiveExceltoMongo(archiveExcelPath);
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
