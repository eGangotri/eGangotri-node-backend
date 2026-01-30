import * as express from 'express';
import { getFolderInSrcRootForProfile } from '../archiveUpload/ArchiveProfileUtils';
import { moveFileSrcToDest, moveItemsInListOfProfileToFreeze, moveProfilesToFreeze } from '../services/yarnService';
import { vanitizePdfForProfiles } from '../vanityService/VanityPdf';
import { timeInfo } from '../mirror/FrontEndBackendCommonCode';
import { compareFolders } from '../folderSync';
import { markUploadCycleAsMovedToFreeze } from '../services/uploadCycleService';
import { unzipAllFilesInDirectory, verifyUnzipSuccessInDirectory } from '../services/zipService';
import { FileMoveTracker } from '../models/FileMoveTracker';
import { GDRIVE_DEFAULT_IGNORE_FOLDER } from '../services/GDriveService';
import { isValidPath, getPathOrSrcRootForProfile } from '../utils/FileUtils';
import { getAllPDFFiles } from '../utils/FileStatsUtils';
import * as fsPromise from 'fs/promises';

export const yarnRoute = express.Router();

yarnRoute.post('/unzipAllFolders', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const folder = req?.body?.folder;
        const ignoreFolder = req?.body?.ignoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;

        console.log(`:unzipAllFolders:
        folders to unzip:
         ${folder?.split(",").map((link: string) => link + "\n ")} 
        `)
        if (!folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "folder to unzip mandatory"
                }
            });
        }
        const results = [];
        const _folder = folder.includes(",") ? folder.split(",").map((link: string) => link.trim()) : [folder.trim()];

        for (const link of _folder) {
            const res = await unzipAllFilesInDirectory(link, "", ignoreFolder);
            results.push(res);
        }

        const resultsSummary = results.map((res: { success_count: number, error_count: number }, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count}`;
        });

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to Unzip All Folders : ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            resultsSummary,
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
})


yarnRoute.post('/verifyUnzipAllFolders', async (req: any, resp: any) => {
    const startTime = Date.now();
    try {
        const folder = req?.body?.folder;
        const ignoreFolder = req?.body?.ignoreFolder || GDRIVE_DEFAULT_IGNORE_FOLDER;

        console.log(`:verifyUnzipAllFolders:
        folders to unzip:
         ${folder?.split(",").map((link: string) => link + "\n ")} 
        `)
        if (!folder) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "folder to unzip for verfication mandatory"
                }
            });
        }
        const results = [];
        const _folder = folder.includes(",") ? folder.split(",").map((link: string) => link.trim()) : [folder.trim()];

        for (const link of _folder) {
            const res = await verifyUnzipSuccessInDirectory(link, "", ignoreFolder);
            results.push(res);
        }

        const resultsSummary = results.map((res: { success_count: number, error_count: number }, index: number) => {
            return `(${index + 1}). Succ: ${res.success_count} Err: ${res.error_count}`;
        });

        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken to Verify 'Unzip All Folders' : ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            title: "UnZip Integrity Verification",
            timeTaken: timeInfo(timeTaken),
            resultsSummary,
            response: results
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
})


yarnRoute.post('/qaToDestFileMover', async (req: any, resp: any) => {
    console.log(`qaToDestFileMover ${JSON.stringify(req.body)} `)
    const startTime = Date.now();
    try {
        const qaPath = req?.body?.qaPath;
        const dest = req?.body?.dest || "";
        const flatten = req?.body?.flatten === "false" ? false : true;
        const ignorePaths = ["dont"];
        const override = req?.body?.override || false;

        console.log(`qaToDestFileMover qaPath ${qaPath} for folder(${dest})`)
        if (!qaPath && !dest) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Src and Dest Items"
                }
            });
            return;
        }
        const paths: string[] = qaPath.includes(",")
            ? qaPath.split(",").map((p: string) => getPathOrSrcRootForProfile(p)).filter(Boolean)
            : [getPathOrSrcRootForProfile(qaPath)];

        if (paths.length === 0) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide valid Src Items"
                }
            });
            return;
        }

        const destPath = getPathOrSrcRootForProfile(dest)

        // Fast check if destination is not empty and override is false
        if (!override) {
            try {
                const destEntries = await fsPromise.readdir(destPath);
                if (destEntries.length > 0) {
                    resp.status(400).send({
                        response: {
                            "status": "failed",
                            "success": false,
                            "message": `Destination folder ${destPath} is not empty. Use override to proceed.`
                        }
                    });
                    return;
                }
            } catch (e) {
                // If directory doesn't exist, it's fine, moveFileSrcToDest will handle it
            }
        }

        let allDestPdfs = null;
        // Only scan destination if it's small or we really need it. 
        // For large destinations, we might want to skip this pre-load.
        // But moveFilesAndFlatten currently uses it for collision checking.
        // Let's scan it once here to avoid multiple scans in the loop.
        console.time('getAllPDFFiles (Route)');
        allDestPdfs = await getAllPDFFiles(destPath);
        console.timeEnd('getAllPDFFiles (Route)');

        console.log(`qaToDestFileMover paths ${paths}`)

        // Process source paths sequentially to avoid potential race conditions on the same destination
        // but remember moveFilesAndFlatten itself is now parallelized.
        const results: any[] = [];
        for (const srcPath of paths) {
            console.log(`qaToDestFileMover srcPath  ${srcPath} to ${destPath}`)
            const listingResult = await moveFileSrcToDest(srcPath, destPath, flatten, ignorePaths, allDestPdfs);
            results.push(listingResult);
            // Update allDestPdfs with newly moved files if we want to be super accurate, 
            // but for performance we might skip or just append.
        }

        const successCount = results.filter((res: any) => !!res?.success).length;
        const failureCount = results.length - successCount;

        const glanceRaw = results.reduce((acc: any, curr: any) => {
            acc.successes.push(curr.success ? 1 : 0);
            acc.totals.push(curr.total || curr.srcPdfsBefore || 0);
            acc.filesMoved.push(curr.filesMoved?.length || 0);
            acc.errors.push(curr.errorList?.length || 0);
            return acc;
        }, emptyResultsAtAGlance());

        const resultsAtAGlance = {
            successes: formatGlance(glanceRaw.successes),
            totals: formatGlance(glanceRaw.totals),
            filesMoved: formatGlance(glanceRaw.filesMoved),
            errors: formatGlance(glanceRaw.errors)
        };

        const timeTaken = Date.now() - startTime;
        console.log(`Time taken for qaToDestFileMover: ${timeInfo(timeTaken)}`);

        resp.status(200).send({
            timeTaken: timeInfo(timeTaken),
            response: {
                resultsAtAGlance,
                total: results.length,
                successCount,
                failureCount,
                results,
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/yarnMoveProfilesToFreeze', async (req: any, resp: any) => {
    console.log(`moveProfilesToFreeze ${JSON.stringify(req.body)} `)
    try {
        const profileAsCSV = req?.body?.profileAsCSV;
        const ignorePaths = req.body?.ignorePaths || ["dont"];
        const flatten = req?.body?.flatten === "false" ? false : true;
        if (!profileAsCSV) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide Profile"
                }
            });
        }
        const _response = await moveProfilesToFreeze(profileAsCSV, flatten, ignorePaths);
        const glanceRaw = (_response.response as any[]).reduce((acc: any, curr: any) => {
            acc.successes.push(curr.success ? 1 : 0);
            acc.totals.push(curr.total || curr.srcPdfsBefore || 0);
            acc.filesMoved.push(curr.filesMoved?.length || 0);
            acc.errors.push(curr.errorList?.length || 0);
            return acc;
        }, emptyResultsAtAGlance());

        const resultsAtAGlance = {
            successes: formatGlance(glanceRaw.successes),
            totals: formatGlance(glanceRaw.totals),
            filesMoved: formatGlance(glanceRaw.filesMoved),
            errors: formatGlance(glanceRaw.errors)
        };

        const total = (_response.response as any[]).length;
        const successCount = (_response.response as any[]).filter((res: any) => !!res?.success).length;
        const failureCount = total - successCount;

        resp.status(200).send({
            response: {
                resultsAtAGlance,
                total,
                successCount,
                failureCount,
                results: _response.response
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnRoute.post('/yarnMoveFilesInListToFreeze', async (req: any, resp: any) => {
    console.log(`yarnMoveFilesInListToFreeze ${JSON.stringify(req.body)} `)
    try {
        const _uploadCycleId = req.body.uploadCycleId;

        if (!_uploadCycleId) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide  UploadCycleId"
                }
            });
        }
        const _response = await moveItemsInListOfProfileToFreeze(_uploadCycleId);
        if (_uploadCycleId) {
            await markUploadCycleAsMovedToFreeze(_uploadCycleId)
        }
        for (const res of _response) {
            console.log(`Saving FileMoveTracker ${JSON.stringify(res)}`)
            const tracker = new FileMoveTracker({
                uploadCycleId: res._uploadCycleId,
                ...res
            });
            await tracker.save()
        }
        const glanceRaw = _response.reduce((acc: any, curr: any) => {
            acc.successes.push(curr.success ? 1 : 0);
            acc.totals.push(curr.total || curr.srcPdfsBefore || 0);
            acc.filesMoved.push(curr.filesMoved?.length || 0);
            acc.errors.push(curr.errorList?.length || 0);
            return acc;
        }, emptyResultsAtAGlance());

        const resultsAtAGlance = {
            successes: formatGlance(glanceRaw.successes),
            totals: formatGlance(glanceRaw.totals),
            filesMoved: formatGlance(glanceRaw.filesMoved),
            errors: formatGlance(glanceRaw.errors)
        };

        const total = _response.length;
        const successCount = _response.filter((res: any) => !!res?.success).length;
        const failureCount = total - successCount;

        resp.status(200).send({
            response: {
                resultsAtAGlance,
                total,
                successCount,
                failureCount,
                results: _response
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/addHeaderFooter', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;

        if (!profile) {
            resp.status(400).send({
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
                msg: `Request Recieved.Header / Footer will be added in few minutes`,
                "success": true,
            }
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

yarnRoute.post('/vanitizePdfs', async (req: any, resp: any) => {
    try {
        const profile = req?.body?.profile;
        const suffix = req?.body?.suffix;
        if (!profile) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "profile is mandatory"
                }
            });
        }
        const res = await vanitizePdfForProfiles(profile, suffix) || {
            "status": "failed",
            "message": "vanitizePdfForProfiles returned null"
        };
        console.log(`vanitizePdfs ${profile} res ${JSON.stringify(res)}`)
        resp.status(200).send({
            response: res
        });
    }

    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


yarnRoute.post('/compareDirectories', async (req: any, resp: any) => {
    try {
        const srcDir = req.body.srcDir
        const destDir = req.body.destDir
        console.log(`/ compareDirectories srcDir ${srcDir} destDir ${destDir} `)
        if (!srcDir || !destDir) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "message": "srcDir and destDir are mandatory"
                }
            });
        }

        let timeNow = Date.now();
        const res = await compareFolders(srcDir, destDir);
        resp.status(200).send({
            response: {
                timeTaken: timeInfo(Date.now() - timeNow),
                ...res
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send({
            response: err.message
        });
    }
})

const emptyResultsAtAGlance = () => {
    return {
        successes: [],
        totals: [],
        filesMoved: [],
        errors: []
    }
}

const formatGlance = (vals: number[]) => {
    const sum = vals.reduce((a, b) => a + b, 0);
    return `${vals.join('+')}=${sum}`;
}