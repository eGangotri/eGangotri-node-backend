const express = require("express");
import { Request, Response } from "express";
import { validateSuperAdminUserFromRequest } from "../services/userService"
import _ from "lodash";
import { UploadCycle } from "../models/uploadCycle";
import { getListOfUploadCycles, getUploadCycleById } from "../services/uploadCycleService";
import { findMissedUploads } from "../services/GradleLauncherUtil";
import { UploadCycleArchiveProfile } from "mirror/types";

export const uploadCycleRoute = express.Router();

/**
 * INSOMNIA POST Request Sample
POST http://localhost/uploadCycleRoute/add 
JSON Body 
{
    "superadmin_user": "",
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
            try {
                const clientIp = req.ip || req.socket.remoteAddress || 'UnknownIP';
                req.body.uploadCenter = clientIp;
            }
            catch (err) {
                console.log("Error getting client IP", err);
            }
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

uploadCycleRoute.post('/getUploadQueueUploadUsheredMissed', async (req: any, resp: any) => {
    const uploadCycleId = req.body.uploadCycleId;
    console.log(`uploadCycleId ${uploadCycleId} ${req.body}`)
    if (!uploadCycleId) {
        resp.status(400).send({ error: 'uploadCycleId is required' });
        return;
    }
    try {
        const _missedForUploadCycleId: UploadCycleArchiveProfile[]
            = await findMissedUploads(uploadCycleId);
        const _data = _missedForUploadCycleId.map(x => {
            return {
                archiveProfile: x.archiveProfile,
                missedCount: x.absolutePaths.length,
                missed: x.absolutePaths
            }
        })
        resp.status(200).send({
            response: {
                success: true,
                missedData: _data
            }
        });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
})

uploadCycleRoute.post("/deleteUploadCycleById", async (req: Request, resp: Response) => {
    console.log(`deleteUploadCycleById: ${JSON.stringify(req.body)}`)

    try {
        const uploadCycleId = req.body.uploadCycleId;
        if (!uploadCycleId) {
            resp.status(400).send({ error: 'uploadCycleId is required' });
            return;
        }
        const uploadCycle = await getUploadCycleById(uploadCycleId);
        if (uploadCycle) {
            uploadCycle.deleted = true;
            await uploadCycle.save();
            resp.status(200).send({
                response: {
                    success: true,
                    message: `uploadCycleId ${uploadCycleId} deleted`
                }
            });
            return;
        }
        else {
            resp.status(200).send({
                response: {
                    success: false,
                    message: `uploadCycleId ${uploadCycleId} not found`
                }
            });
        }
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
});

