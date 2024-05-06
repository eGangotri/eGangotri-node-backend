const express = require("express");
import { Request, Response } from "express";
import { validateSuperAdminUserFromRequest } from "../services/userService"
import _ from "lodash";
import { UploadCycle } from "../models/uploadCycle";
import { getListOfUploadCycles } from "../services/uploadCycleService";

export const uploadCycleRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/uploadCycleRoute/add 
JSON Body 
{
	"superadmin_user": "chetan",
	"superadmin_password": "XXXXX",
	"uploadCycleId": "2",
	"uploadCount": 4,
	"archiveProfiles": [
		{
			"archiveProfile": "VT",
			"count": 4
		}
	],
	"datetimeUploadStarted": "12/12/2002 12:12:21"
}
*/

uploadCycleRoute.post("/add", async (req: Request, resp: Response) => {
    try {
        const _validate = await validateSuperAdminUserFromRequest(req);
        if (_validate[0]) {
            console.log("req.body:add")
            const uq = new UploadCycle(req.body);
            await uq.save();
            resp.status(200).send(uq);
        }
        else {
            resp.status(200).send({ error: _validate[1] });
        }

    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
});

uploadCycleRoute.get('/list', async (req: Request, resp: Response) => {
    try {
        const items = await getListOfUploadCycles(req?.query);
        console.log(`after getListOfItemsUshered retirieved item count: ${items.length}`)
        resp.status(200).send({
            "response": items
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})
