const express = require("express");
import e, { Request, Response } from "express";
import { getDiffBetweenGDriveAndLocalFiles, getListOfGDriveItems } from "../services/GDriveItemService";

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
