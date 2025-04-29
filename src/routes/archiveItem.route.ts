const express = require("express");
import e, { Request, Response } from "express";
import { getArchiveItemStatistics, getArchiveSourceStatistics, getListOfArchiveItems } from "../services/archiveItemService";
import { ArchiveItemListOptionsType } from "types/listingTypes";

export const archiveItemRoute = express.Router();

archiveItemRoute.post("/search", async (req: Request, resp: Response) => {
    try {
        const searchTerm = req.body.searchTerm;
        if (!searchTerm?.trim()) {
            resp.status(400).send({
                response: {
                    "status": "failed",
                    "success": false,
                    "message": "Pls. provide search term"
                }
            });
        }
        else {
            console.log(`archiveItemRoute /search ${JSON.stringify(searchTerm)}`);
            const archiveItems = await getListOfArchiveItems({searchTerm});
            console.log(`archiveItemRoute /search ${JSON.stringify(archiveItems?.length > 0 ? archiveItems[0] : [])}`);
            resp.status(200).send({
                response: archiveItems
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


archiveItemRoute.post('/getArchiveItemPerProfile/:profile', async (req: any, resp: any) => {
    getArchiveItem(req, resp);
})
archiveItemRoute.post('/getArchiveItemPerProfile/', async (req: any, resp: any) => {
    getArchiveItem(req, resp);
})

const getArchiveItem = async (req: any, resp: any) => {
    const archiveProfiles = req.params.profile || "";
    console.log(`getArchiveItem:`,archiveProfiles);
    const { page = 1, limit = 10, sortField = "createdTime", sortOrder = "asc" } = req.body;
    let _options: ArchiveItemListOptionsType = {
        // page, 
        limit,
        //   sortField, 
        //   sortOrder
    }
    if (archiveProfiles) {
        _options = {
            ..._options,
            acct:archiveProfiles
        }
    }
    try {
        const archiveItems = await getListOfArchiveItems(_options);
        console.log(`_resp: ${JSON.stringify(archiveItems[0])}`);
        if (!archiveItems || archiveItems.length === 0) {
            resp.status(200).send({
                response: {
                    success: false,
                    msg: `No data corresponding to ${archiveProfiles} found`

                }
            });
        }
        else {
            resp.status(200).send({
                response: archiveItems
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
}

archiveItemRoute.get('/archiveDBStatsByProfile', async (req: any, resp: any) => {
    console.log(`archiveDBStatsByProfile:`);
    try {
        const aggregatedData = await getArchiveItemStatistics();
        console.log(`aggregatedData: ${JSON.stringify(aggregatedData[0])}`);
        if (!aggregatedData || aggregatedData.length === 0) {
            resp.status(200).send({
                response: {
                    success: false,
                    msg: `No Data found in Archive DB collection`

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

archiveItemRoute.get('/archiveDBStatsBySources', async (req: any, resp: any) => {
    console.log(`archiveDBStatsBySources:`);
    try {
        const aggregatedData = await getArchiveSourceStatistics();
        console.log(`aggregatedData: ${JSON.stringify(aggregatedData[0])}`);
        if (!aggregatedData || aggregatedData.length === 0) {
            resp.status(200).send({
                response: {
                    success: false,
                    msg: `No Data found in Archive DB collection`

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