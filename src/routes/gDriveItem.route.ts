const express = require("express");
import e, { Request, Response } from "express";
import { getListOfArchiveItems } from "../services/archiveItemService";

export const GDriveItemRoute = express.Router();

GDriveItemRoute.post("/search", async (req: Request, resp: Response) => {
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
            const archiveItems = await getListOfArchiveItems({searchTerm});
            console.log(`gDriveItemRoute /search ${JSON.stringify(archiveItems?.length > 0 ? archiveItems[0] : [])}`);
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

