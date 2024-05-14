import * as express from 'express';
import { MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG, scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { archiveExceltoMongo } from '../excelToMongo/transferArchiveExcelToMongo';
import { downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { resetDownloadCounters } from '../cliBased/pdf/utils';
import { alterExcelWithUploadedFlag, getSuccessfullyUploadedItemsForUploadCycleId, validateDateRange } from '../services/yarnArchiveService';
import _ from 'lodash';
import { excelToJson, jsonToExcel } from '../cliBased/excel/ExcelUtils';
import path from 'path';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../utils/constants';

export const launchArchiveYarnRoute = express.Router();

launchArchiveYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLinks = req?.body?.archiveLinks;
        const onlyLinks = (req?.body?.onlyLinks == true) || false;
        const limitedFields = (req?.body?.limitedFields == true) || false;
        const dateRange = req?.body?.dateRange || ""; //dateRange:"2024/04/01-2024/04/31"
        const maxItems = req?.body?.maxItems || MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG;
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
        const _resp: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLinks, onlyLinks, limitedFields, parsedDateRange, maxItems);
        resp.status(200).send({
            response: {
                _results: _resp,
                caution:"Max API supports is 10K results. For more use scraping API. See https://archive.org/help/aboutsearch.htm  or, you may request up to 1000000000 results at one time if you do NOT specify any page. For best results,  do NOT specify sort (sort may be automatically disabled for very large queries).)"
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
        const uploadableExcelPath = req.body.mainExcelPath;
        const archiveExcelPath = req.body.archiveExcelPath;

        const uploadableExcelAsJSON = excelToJson(uploadableExcelPath)

        const archiveExcelPaths = archiveExcelPath.split(",");
        const archiveExcelsAsJson = []
        for (const _path of archiveExcelPaths) {
            console.log(`_path ${_path}`)
            const _archiveJsonArray = excelToJson(_path.trim())
            console.log(`_archiveJsonArray pushing ${_archiveJsonArray.length} items from ${_path}`)
            archiveExcelsAsJson.push(..._archiveJsonArray)
        }

        console.log(`uploadableExcelAsJSON ${uploadableExcelAsJSON.length}`)
        console.log(`archiveExcelsAsJson ${archiveExcelsAsJson.length}\n`)
        console.log("first tile" + archiveExcelsAsJson[0][
            "Title-Archive"
        ].substring(0, 8));
        console.log("first absPath" + uploadableExcelAsJSON[0]["absPath"]);

        const archiveJsonArrayTitles = archiveExcelsAsJson.map(x => x["Title-Archive"]?.substring(0, 8)?.split(/\s/)?.join(""));
        console.log(`archiveJsonArrayTitles ${archiveJsonArrayTitles.length}\n`)
        console.log(`archiveJsonArrayTitles ${archiveJsonArrayTitles[0]}`);

        const uplodableJsonArrayTitles = uploadableExcelAsJSON.map(x => path.basename(x["absPath"] || "")?.substring(0, 7));
        console.log(`leftJsonArrayTitles ${uplodableJsonArrayTitles.length}`)
        console.log(`leftJsonArrayTitles ${uplodableJsonArrayTitles[0]}`)

        const diff = _.difference(uplodableJsonArrayTitles, archiveJsonArrayTitles);
        console.log(`diff ${diff.length} ${diff[0]}`)

        const diffUplodables = uploadableExcelAsJSON.filter((item) => {
            return diff.includes(path.basename(item["absPath"] || "")?.substring(0, 7))
        } );
       
        const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        console.log( "diffUpl Length" + diffUplodables.length)
        const excelName = `${folder}${timeComponent}-fip-final-diff-Uplodables(${diffUplodables.length}).xlsx`
        jsonToExcel(diffUplodables, excelName)
       
        resp.status(200).send({
            response: {
                diffUplodables: diffUplodables.length,
                excel: `Excel ${excelName} created for ${diffUplodables.length} items not found in Archive`,
                msg: `${diff.length} items not found in Archive`,
                diff,
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

