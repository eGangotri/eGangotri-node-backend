import * as express from 'express';
import { findTopNLongestFileNames } from '../utils/utils';
import { getDuplicatesBySize } from '../utils/FileUtils';
import { renameAllNonAsciiInFolder } from '../files/renameNonAsciiFiles';
import { DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL } from '../aksharamukha/convert';
import { convertJpgsToPdf } from '../imgToPdf/jpgToPdf';

export const fileUtilsRoute = express.Router();

fileUtilsRoute.post('/duplicatesByFileSize', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder1;
        const folder2 = req.body.folder2

        console.log(`folder: ${folder} folder2: ${folder2}`);
        const result = await getDuplicatesBySize(folder, folder2);
        resp.status(200).send({
            response: result
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})


fileUtilsRoute.post('/topLongFileNames', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const topN = req.body.topN || 1;
        const includePathInCalc = req.body.includePathInCalc || false;
        console.log(`folder: ${folder} topN: ${topN} includePathInCalc: ${includePathInCalc}`);
        const longestFileName = findTopNLongestFileNames(folder, topN, includePathInCalc);
        resp.status(200).send({
            response: {
                googleDriveLimit: "Google Drive API has a limit of 255 characters for file names.",
                msg: `Top ${longestFileName.length} Longest File Names in ${folder} are:`,
                longestFileName: longestFileName.map((item: any) => {
                    return `${item} (${item.length})`
                })
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/renameNonAsciiFiles', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const script = req.body.script;

        console.log(`folder: ${folder} folder: ${folder} language: ${script}`);
        const renamedFiles = await renameAllNonAsciiInFolder(folder, script);
        resp.status(200).send({
            response: {
                src: folder,
                destination: `${folder}/${DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL}`,
                msg: `${renamedFiles.length} files renamed from ${folder} and copied to ${folder}/${DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL}.`,
                renamedFiles
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

fileUtilsRoute.post('/imgFilesToPdf', async (req: any, resp: any) => {
    try {
        const folder = req.body.folder;
        const imgFilesToPdf = req.body.imgFilesToPdf;

        console.log(`folder: ${folder} imgFilesToPdf: ${imgFilesToPdf} `);
        let res = {};
        switch (imgFilesToPdf) {
            case "JPG":
                res = await convertJpgsToPdf(folder);
                break;

            case "PNG":
                res = { msg: "PNG to PDF conversion is not supported yet." };
                break;

            case "TIFF":
                res = { msg: "TIFF to PDF conversion is not supported yet." };
                break;
        }

        resp.status(200).send({
            response: res
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})