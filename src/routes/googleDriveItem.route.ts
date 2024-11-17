const express = require("express");
import e, { Request, Response } from "express";
import { getDiffBetweenGDriveAndLocalFiles, getListOfGDriveItems, getSourceStatistics } from "../services/GDriveItemService";
import { uploadToGDriveBasedOnDiffExcel } from "../cliBased/googleapi/GoogleDriveUpload";
import { GDriveItemListOptionsType } from "types/listingTypes";

export const googleDriveItemRoute = express.Router();

googleDriveItemRoute.post("/search", async (req: Request, resp: Response) => {
    try {
        const searchTerm = req.body.searchTerm;
        if (!searchTerm?.trim()) {
            resp.status(300).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide search term"
                }
            });
        }
        else {
            console.log(`gDriveItemRoute /search ${JSON.stringify(searchTerm)}`);
            const gDriveItems = await getListOfGDriveItems({ searchTerm });
            console.log(`gDriveItemRoute /search ${JSON.stringify(gDriveItems?.length > 0 ? gDriveItems[0] : [])}`);
            resp.status(200).send({
                response: gDriveItems
            });
        }
    } catch (err) {
        console.log("Error", err);
        resp.status(400).send({
            error: `exception thrown: ${err}`,
            success: false
        });
    }
});

googleDriveItemRoute.post('/compareGDriveAndLocalExcel', async (req: any, resp: any) => {
    try {
        const gDriveExcel = req.body.gDriveExcel;
        const localExcel = req.body.localExcel;
        const _resp = getDiffBetweenGDriveAndLocalFiles(gDriveExcel, localExcel);
        resp.status(200).send({
            response: _resp
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

googleDriveItemRoute.post('/uploadToGDriveBasedOnDiffExcel', async (req: any, resp: any) => {
    const diffExcel = req.body.diffExcel;
    const gDriveRootFolder = req.body.gDriveRoot;
    console.log(`diffExcel: ${diffExcel} gDriveRootFolder: ${gDriveRootFolder}`);
    if (!gDriveRootFolder?.trim()?.startsWith("https://drive.google.com/drive/folders/")) {
        resp.status(400).send({
            response: {
                "status": "failed",
                "success": false,
                "message": "Pls. provide valid Google Drive Link "
            }
        });
    }
    else {
        try {
            const _resp = await uploadToGDriveBasedOnDiffExcel(diffExcel, gDriveRootFolder);
            console.log(`_resp: ${JSON.stringify(_resp)}`);
            resp.status(200).send({
                response: _resp
            });
        }
        catch (err: any) {
            console.log('Error', err);
            resp.status(400).send(err);
        }
    }
})

googleDriveItemRoute.post('/getPerSource/:value', async (req: any, resp: any) => {
    getPerSource(req, resp);
})
googleDriveItemRoute.post('/getPerSource/', async (req: any, resp: any) => {
    getPerSource(req, resp);
})

const getPerSource = async (req: any, resp: any) => {
    console.log(`getPerSource:`, req.params.value);
    const { page = 1, limit = 10, sortField = "createdTime", sortOrder = "asc" } = req.body;
    const source = req.params.value || "";
    let _options: GDriveItemListOptionsType = {
        // page, 
        limit,
        //   sortField, 
        //   sortOrder
    }
    if (source) {
        _options = {
            ..._options,
            source: source
        }
    }
    try {
        const _gDriveItemsList = await getListOfGDriveItems(_options);
        console.log(`_resp: ${JSON.stringify(_gDriveItemsList[0])}`);
        if (!_gDriveItemsList || _gDriveItemsList.length === 0) {
            resp.status(200).send({
                response: {
                    success: false,
                    msg: `No data corresponding to ${source} found`

                }
            });
        }
        else {
            resp.status(200).send({
                response: _gDriveItemsList
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
}
googleDriveItemRoute.get('/gdriveDBAggregatedBySource', async (req: any, resp: any) => {
    console.log(`gdriveDBAggregatedBySource:`);

    try {
        const aggregatedData = await getSourceStatistics();
        console.log(`_resp: ${JSON.stringify(aggregatedData[0])}`);
        if (!aggregatedData || aggregatedData.length === 0) {
            resp.status(200).send({
                response: {
                    success: false,
                    msg: `No Data found in GDriveItem collection`

                }
            });
        }
        else {
            resp.status(200).send({
                response: aggregatedData
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

