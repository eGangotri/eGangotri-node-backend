import * as express from 'express';
import { MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG, scrapeArchiveOrgProfiles } from '../archiveDotOrg/archiveScraper';
import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus } from '../archiveDotOrg/types';
import { archiveExceltoMongo } from '../excelToMongo/transferArchiveExcelToMongo';
import { downloadArchiveItems, downloadPdfFromArchiveToProfile } from '../archiveDotOrg/downloadUtil';
import { alterExcelWithUploadedFlag, convertArchiveExcelToLinkData, getSuccessfullyUploadedItemsForUploadCycleId, validateDateRange } from '../services/yarnArchiveService';
import _ from 'lodash';
import { excelToJson, jsonToExcel } from '../cliBased/excel/ExcelUtils';
import path from 'path';
import moment from 'moment';
import { DD_MM_YYYY_HH_MMFORMAT } from '../utils/constants';
import { generateEAPBLMetadataForProfile } from '../eap_bl';
import { formatTime } from '../imgToPdf/utils/Utils';
import { DOWNLOAD_COMPLETED_COUNT, DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT } from '../cliBased/pdf/utils';
import { getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { randomUUID } from 'crypto';
import { createArchiveDownloadRequest, updateArchiveDownloadRequestStatus, getArchiveDownloadRequests, getArchiveDownloadItemsByRunId } from '../services/ArchiveDownloadMonitorService';
import { ArchiveDownloadRequest } from '../models/ArchiveDownloadRequest';
import { ArchiveDownloadItem } from '../models/ArchiveDownloadItem';
import { downloadFileFromUrl } from '../cliBased/pdf/downloadFile';

export const launchArchiveYarnRoute = express.Router();

launchArchiveYarnRoute.post('/getArchiveListing', async (req: any, resp: any) => {
    try {
        const archiveLinks = req?.body?.archiveLinks;
        const onlyLinks = (req?.body?.onlyLinks == true) || false;
        const limitedFields = (req?.body?.limitedFields == true) || false;
        const dateRange = req?.body?.dateRange || ""; //dateRange:"2024/04/01-2024/04/31"
        const ascOrder = req?.body?.ascOrder || false;
        const maxItemsInput = req?.body?.maxItems;
        let maxItemsOrRange: number | [number, number] = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG;

        if (maxItemsInput) {
            if (typeof maxItemsInput === 'number') {
                maxItemsOrRange = maxItemsInput;
            } else if (typeof maxItemsInput === 'string') {
                const matches = maxItemsInput.match(/(\d+)/g);
                if (matches && matches.length >= 2) {
                    // Extract start and end. e.g. "20-90" -> [20, 90]
                    maxItemsOrRange = [parseInt(matches[0]), parseInt(matches[1])];
                } else if (matches && matches.length === 1) {
                    maxItemsOrRange = parseInt(matches[0]);
                }
            }
        }
        let parsedDateRange: [number, number] = [0, 0]

        console.log(`getArchiveListing params ${JSON.stringify(req.body)}`)

        if (dateRange) {
            const _validateDates = validateDateRange(dateRange);
            console.log(`validateDateRange ${_validateDates}`)
            if (dateRange && _validateDates.success) {
                parsedDateRange = _validateDates.parsedDateRange;
            }
            else {
                return resp.status(400).send({
                    response: {
                        ..._validateDates
                    }
                });
            }
        }

        if (!archiveLinks) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide archive Links. At least one is mandatory"
                }
            });
        }
        const _resp: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLinks, parsedDateRange, onlyLinks, limitedFields, ascOrder, maxItemsOrRange);
        resp.status(200).send({
            response: {
                _results: _resp,
                caution: "Max API supports is 10K results. For more use scraping API. See https://archive.org/help/aboutsearch.htm  or, you may request up to 1000000000 results at one time if you do NOT specify any page. For best results,  do NOT specify sort (sort may be automatically disabled for very large queries).)"
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
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Archive Link(s) and profile. Both are mandatory"
                }
            });
        }
        const pdfDumpFolder = getPathOrSrcRootForProfile(profileOrPath);

        const maxItemsInput = req?.body?.maxItems;
        let maxItemsOrRange: number | [number, number] = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG;

        if (maxItemsInput) {
            if (typeof maxItemsInput === 'number') {
                maxItemsOrRange = maxItemsInput;
            } else if (typeof maxItemsInput === 'string') {
                const matches = maxItemsInput.match(/(\d+)/g);
                if (matches && matches.length >= 2) {
                    maxItemsOrRange = [parseInt(matches[0]), parseInt(matches[1])];
                } else if (matches && matches.length === 1) {
                    maxItemsOrRange = parseInt(matches[0]);
                }
            }
        }

        const _archiveScrappedData: ArchiveDataRetrievalMsg = await scrapeArchiveOrgProfiles(archiveLink, dateRange, true, false, false, maxItemsOrRange);

        const scrapedLinks: ArchiveDataRetrievalStatus[] = _archiveScrappedData.scrapedMetadata
        const results = []
        console.log(`scrapedLinks ${JSON.stringify(scrapedLinks?.length)}`)
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
            const downloadArchiveCounterController = Math.random().toString(36).substring(7);
            const commonRunId = randomUUID();
            const runId = randomUUID();

            await createArchiveDownloadRequest({
                runId,
                commonRunId,
                archiveUrl: archiveLink,
                profileOrAbsPath: profileOrPath
            });

            try {
                console.log(`downloadPdfFromArchiveToProfile: ${entry.archiveReport.linkData} profileOrPath ${profileOrPath}`)
                const res = await downloadPdfFromArchiveToProfile(entry.archiveReport.linkData, profileOrPath, downloadArchiveCounterController, runId, commonRunId);
                results.push(res);
                await updateArchiveDownloadRequestStatus(runId, 'success', `Processed ${entry.archiveAcctName}`);
            }
            catch (err) {
                console.log(`Error ${err}`)
                results.push({
                    "status": "failed",
                    "error": err,
                    "success": false,
                    msg: `Failed for ${entry.archiveAcctName}`,
                });
                await updateArchiveDownloadRequestStatus(runId, 'failed', `Error: ${err.message || err}`);
            }
        }

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download pdfs: ${formatTime(timeTaken)}`);
        resp.status(200).send({
            timeTaken: formatTime(timeTaken),
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
        const source = req?.body?.source;

        console.log(`dumpArchiveExcelToMongo
        comboExcelPath ${archiveExcelPath} ${source}
        `)

        if (!archiveExcelPath) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Archive Excel Path and Folder Name"
                }
            });
            return;
        }
        const _resp = archiveExceltoMongo(archiveExcelPath, source);
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


launchArchiveYarnRoute.post('/compareUploadsViaExcelV1WithArchiveOrg', async (req: any, resp: any) => {
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
        });

        const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        console.log("diffUpl Length" + diffUplodables.length)
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

launchArchiveYarnRoute.post('/compareUploadsViaExcelV3WithArchiveOrg', async (req: any, resp: any) => {
    try {
        const profileName = req.body.profileName;
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

        console.log(`uploadableExcelAsJSON: ${uploadableExcelAsJSON.length}`)
        console.log(`archiveExcelsAsJson: ${archiveExcelsAsJson.length}\n`)
        console.log("first absPath: " + uploadableExcelAsJSON[0]["absPath"]);

        const archiveJsonArrayTitles = archiveExcelsAsJson.map(x => x["Original Title"]);
        console.log(`archiveJsonArrayTitles: ${archiveJsonArrayTitles.length}\n`)
        console.log(`archiveJsonArrayTitles first element: ${archiveJsonArrayTitles[0]}`);

        const uplodableJsonArrayTitles = uploadableExcelAsJSON.map(x => path.parse(x["absPath"] || "").name);
        console.log(`uplodableJsonArrayTitles: ${uplodableJsonArrayTitles.length}`)
        console.log(`uplodableJsonArrayTitles first element: ${uplodableJsonArrayTitles[0]}`)

        const diff = _.difference(uplodableJsonArrayTitles, archiveJsonArrayTitles);
        console.log(`diff ${diff.length} ${diff[0]}`)

        const diffUplodables = uploadableExcelAsJSON.filter((item) => {
            return diff.includes(path.parse(item["absPath"] || "").name)
        });

        const folder = (process.env.HOME || process.env.USERPROFILE) + path.sep + 'Downloads' + path.sep;
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        console.log("diffUpl Length" + diffUplodables.length)
        const excelName = `${folder}${profileName}-diff-Uplodables(${diffUplodables.length})-${timeComponent}.xlsx`
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


launchArchiveYarnRoute.post('/downloadArchiveItemsViaExcel', async (req: any, resp: any) => {
    try {
        const excelPath = req?.body?.excelPath;
        const profileOrPath = req?.body?.profileOrPath;
        const startTime = Date.now();

        if (!excelPath || !profileOrPath) {
            return resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "msg": "Pls. provide Excel Path and profile/abs-path. Both are mandatory"
                }
            });
        }
        const _linkData = convertArchiveExcelToLinkData(excelPath);
        const downloadArchiveCounterController = Math.random().toString(36).substring(7);
        const commonRunId = randomUUID();
        const runId = randomUUID();

        await createArchiveDownloadRequest({
            runId,
            commonRunId,
            excelPath,
            profileOrAbsPath: profileOrPath,
            totalItems: _linkData.length
        });

        const _results = await downloadArchiveItems(_linkData, profileOrPath, downloadArchiveCounterController, runId, commonRunId);

        console.log(`Success count: ${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController)}`);
        console.log(`Error count: ${DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController)}`);
        const _resp = {
            status: `${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController)} out of ${DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController) + DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController)} made it`,
            success_count: DOWNLOAD_COMPLETED_COUNT(downloadArchiveCounterController),
            error_count: DOWNLOAD_DOWNLOAD_IN_ERROR_COUNT(downloadArchiveCounterController),
            ..._results
        }
        console.log(`_resp : ${JSON.stringify(_resp)}`);

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to download archiveItems from Excel: ${formatTime(timeTaken)}`);

        await updateArchiveDownloadRequestStatus(runId, 'success', `Processed ${_linkData.length} items from excel`);

        resp.status(200).send({
            timeTaken: formatTime(timeTaken),
            response: _resp,
            runId,
            commonRunId
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

launchArchiveYarnRoute.post('/generateEapExcelV1', async (req: any, resp: any) => {
    try {
        const profileName = req.body.profileName;
        const excelOutputName = req.body.excelOutputName || "";
        console.log(`generateEapExcelV1: ${profileName}`)
        const res = await generateEAPBLMetadataForProfile(profileName, excelOutputName);
        if (!res.success) {
            resp.status(400).send({
                response: {
                    ...res
                }
            });
            return;
        }
        else {
            resp.status(200).send({
                response: {
                    ...res
                }
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
launchArchiveYarnRoute.get("/getAllArchiveDownloadRequests", async (req: any, res: any) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 1;
        const limit = Number.parseInt(req.query.limit as string) || 20;
        const results = await getArchiveDownloadRequests(page, limit);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching Archive download requests", error: error.message });
    }
});

launchArchiveYarnRoute.get("/getArchiveDownloadItemsByRunId/:runId", async (req: any, res: any) => {
    try {
        const runId = req.params.runId;
        const results = await getArchiveDownloadItemsByRunId(runId);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching Archive download items", error: error.message });
    }
});

launchArchiveYarnRoute.post("/retryArchiveDownloadByRunId/:runId", async (req: any, res: any) => {
    try {
        const runId = req.params.runId;
        const requestDoc = await ArchiveDownloadRequest.findOne({ runId });
        if (!requestDoc) {
            return res.status(404).json({ message: "Download request not found" });
        }

        const failedItems = await ArchiveDownloadItem.find({ runId, status: 'failed' });
        if (failedItems.length === 0) {
            return res.status(200).json({ message: "No failed items to retry" });
        }

        const downloadArchiveCounterController = randomUUID();
        const results = [];

        // Update request status to in-progress
        await updateArchiveDownloadRequestStatus(runId, 'retrying', `Retrying ${failedItems.length} failed items`);

        for (const item of failedItems) {
            console.log(`Retrying download for ${item.fileName}`);
            const res = await downloadFileFromUrl(path.dirname(item.filePath || requestDoc.profileOrAbsPath), item.archiveUrl, item.fileName, failedItems.length, "0", downloadArchiveCounterController, runId, requestDoc.commonRunId);
            results.push(res);
        }

        await updateArchiveDownloadRequestStatus(runId, 'success', `Retry completed for ${failedItems.length} items`);

        res.status(200).json({
            message: `Retry initiated for ${failedItems.length} items`,
            results
        });
    } catch (error: any) {
        res.status(500).json({ message: "Error retrying Archive download", error: error.message });
    }
});

launchArchiveYarnRoute.post('/softDeleteArchiveDownload', async (req: any, resp: any) => {
    try {
        const runId = req?.body?.runId;
        if (!runId) {
            return resp.status(400).json({ status: 'failed', message: 'runId is required' });
        }
        const archiveDownload = await ArchiveDownloadRequest.findOneAndUpdate({ runId }, { deleted: true }, { new: true });
        return resp.status(200).json({ status: !!archiveDownload, message: `${runId} ArchiveDownload deleted ${archiveDownload ? 'successfully' : 'unsuccessfully'}` });
    } catch (error: any) {
        console.error(`/ softDeleteArchiveDownload error: ${error?.message || String(error)} `);
        return resp.status(500).json({ status: 'failed', message: error?.message || String(error) });
    }
});

launchArchiveYarnRoute.post('/markVerifiedArchiveDownload', async (req: any, resp: any) => {
    try {
        const { id, verify } = req.body;
        if (!id) {
            return resp.status(400).json({ status: 'failed', message: 'id is required' });
        }
        const archiveDownload = await ArchiveDownloadRequest.findByIdAndUpdate(id, { verify }, { new: true });
        return resp.status(200).json({ status: !!archiveDownload, message: `${id} ArchiveDownload verification updated to ${verify}` });
    } catch (error: any) {
        return resp.status(500).json({ status: 'failed', message: error?.message || String(error) });
    }
});
