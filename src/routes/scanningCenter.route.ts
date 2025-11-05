import * as express from 'express';
import { addCentersAndLibraries, getCentersAndLibraries, softDeleteCenter, editCenter } from '../services/scanningCenterService';
import { ScanningCenter } from '../models/scanningCenters';
import { validateAdminSuperAdminUserFromRequest } from '../services/userService';

export const scanningCenterRoute = express.Router();

scanningCenterRoute.get('/getCenters', async (req: any, resp: any) => {
    const centersAndLibraries = await getCentersAndLibraries();
    console.log(`centersAndLibraries: ${JSON.stringify(centersAndLibraries)}`);
    try {
        resp.status(200).send({
            response: centersAndLibraries
        });
    }

    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})

scanningCenterRoute.patch('/centers/:centerId', async (req: any, resp: any) => {
    try {
        const operatorName = req.body.operatorName
        if (await validateAdminSuperAdminUserFromRequest(req)) {
            const centerId = req.params.centerId
            const updates = {
                centerName: req.body.centerName,
                libraries: req.body.libraries,
            } as { centerName?: string; libraries?: string[] }
            if (!centerId) {
                return resp.status(400).send({
                    response: {
                        "status": "failed",
                        "message": "centerId is required"
                    }
                });
            }
            const result = await editCenter(centerId, updates);
            if (!result.success) {
                resp.status(400).send({
                    response: result
                });
            } else {
                resp.status(200).send({
                    response: result
                });
            }
        } else {
            resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
        }
    }
    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})

scanningCenterRoute.post('/addCenter', async (req: any, resp: any) => {
    try {
        const operatorName = req.body.operatorName
        if (await validateAdminSuperAdminUserFromRequest(req)) {
            const center = new ScanningCenter(req.body);
            if (!center) {
                return resp.status(400).send({
                    response: {
                        "status": "failed",
                        "message": "Couldnt Save."
                    }
                });
            }
            const centerRes = await addCentersAndLibraries(center);
            if (!centerRes.success) {
                resp.status(400).send({
                    response: centerRes
                });
            }
            else {
                console.log(`center added : ${JSON.stringify(centerRes)}`);
                resp.status(200).send({
                    response: centerRes
                });
            }
        }
        else {
            resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
        }
    }

    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})

scanningCenterRoute.post('/deleteCenter', async (req: any, resp: any) => {
    try {
        const operatorName = req.body.operatorName
        if (await validateAdminSuperAdminUserFromRequest(req)) {
            const centerId = req.body.centerId
            if (!centerId) {
                return resp.status(400).send({
                    response: {
                        "status": "failed",
                        "message": "centerId is required"
                    }
                });
            }
            const result = await softDeleteCenter(centerId, operatorName);
            if (!result.success) {
                resp.status(400).send({
                    response: result
                });
            } else {
                resp.status(200).send({
                    response: result
                });
            }
        } else {
            resp.status(200).send({ error: `Couldn't validate User ${operatorName}` });
        }
    }
    catch (err: any) {
        console.log('Error:', err);
        resp.status(200).send({
            success: false,
            response: `${err.message}`
        });
    }
})



