import * as express from 'express';
import { scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { archiveExceltoMongo } from '../excelToMongo/transferArchiveExcelToMongo';
import { downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { alterExcelWithUploadedFlag, getSuccessfullyUploadedItemsForUploadCycleId, validateDateRange } from '../services/yarnArchiveService';
import _ from 'lodash';
import { excelToJson } from '../cliBased/excel/ExcelUtils';
import { arch } from 'os';
import path from 'path';

export const launchArchiveYarnRoute = express.Router();

launchArchiveYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLinks = req?.body?.archiveLinks;
        const onlyLinks = (req?.body?.onlyLinks == true) || false;
        const limitedFields = (req?.body?.limitedFields == true) || false;
        const dateRange = req?.body?.dateRange || ""; //dateRange:"2024/04/01-2024/04/31"
        let parsedDateRange: [number, number] = [0, 0]

        /** 
         * FOR MORE THAN 10,000 
         *     "errors": [
              {
                "message": "Invalid request ([RANGE_OUT_OF_BOUNDS] paging is only supported through 10000 results; scraping is supported through the Scraping API, see https://archive.org/help/aboutsearch.htm  or, you may request up to 1000000000 results at one time if you do NOT specify any page. For best results,  do NOT specify sort (sort may be automatically disabled for very large queries).)",
                "forensics": null,
                "context": "client_request"
              }
            ],
        
         */


        if (dateRange) {
            const _validateDates = validateDateRange(dateRange);
            console.log(`validateDateRange ${_validateDates}`)
            if (dateRange && _validateDates.success) {
                parsedDateRange = _validateDates.parsedDateRange;
            }
            else {
                return resp.status(300).send({
                    response: {
                        ..._validateDates
                    }
                });
            }
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

launchArchiveYarnRoute.post('/markAsUploadedEntriesInArchiveExcel', async (req: any, resp: any) => {
    try {
        const pathOrUploadCycleId = req.body.pathOrUploadCycleId;
        const archiveExcelPath = req.body.archiveExcelPath;
        const successUploadData = await getSuccessfullyUploadedItemsForUploadCycleId(pathOrUploadCycleId);
        const successfullyUploadedCount = _.sumBy(successUploadData, (o) => o.isValid ? 1 : 0);
        const alterationDats = alterExcelWithUploadedFlag(archiveExcelPath, successUploadData);
        resp.status(200).send({
            response: {
                successUploads: `${successfullyUploadedCount}`,
                failedUploads: `${successUploadData.length - successfullyUploadedCount}`,
                total: `Total Checked : ${successUploadData.length} in ${pathOrUploadCycleId}`,
                ...alterationDats
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


launchArchiveYarnRoute.post('/compareUploadsViaExcelWithArchiveOrg', async (req: any, resp: any) => {
    try {
        const mainExcelPath = req.body.mainExcelPath;
        const archiveExcelPath = req.body.archiveExcelPath;

        const leftJsonArray = excelToJson(mainExcelPath)
        const archiveJsonArray = excelToJson(archiveExcelPath)

        console.log(`leftJsonArray ${leftJsonArray.length}`)
        console.log(`rightJsonArray ${archiveJsonArray.length}\n`)
        console.log("first tile" + archiveJsonArray[0][
            "Title-Archive"
        ].substring(0, 8));
        console.log("first absPath" + leftJsonArray[0]["absPath"]);

        const archiveJsonArrayTitles = archiveJsonArray.map(x => x["Title-Archive"]?.substring(0, 8)?.split(/\s/)?.join(""));
        console.log(`archiveJsonArrayTitles ${archiveJsonArrayTitles.length}\n`)
        console.log(`archiveJsonArrayTitles ${archiveJsonArrayTitles[0]}`);

        const leftJsonArrayTitles = leftJsonArray.map(x => path.basename(x["absPath"] || "")?.substring(0, 7));
        console.log(`leftJsonArrayTitles ${leftJsonArrayTitles.length}`)
        console.log(`leftJsonArrayTitles ${leftJsonArrayTitles[0]}`)

        const diff = _.difference(leftJsonArrayTitles, archiveJsonArrayTitles);
        console.log(`diff ${diff.length} ${diff[0]}`)

        resp.status(200).send({
            response: diff
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

