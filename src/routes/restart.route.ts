import * as express from 'express';
import { RestartRequest } from '../models/restartRequest';

export const restartRoute = express.Router();

/**
 * Polled every minute by the bat file on the laptop.
 * If restartFlag === 1, atomically resets it to 0 and tells the caller to restart.
 * Otherwise just records the ping.
 */
restartRoute.get('/check/:machineName', async (req: any, resp: any) => {
    try {
        const machineName = req.params.machineName;
        const consumed = await RestartRequest.findOneAndUpdate(
            { machineName, restartFlag: 1 },
            { $set: { restartFlag: 0, lastPingAt: new Date(), lastRestartConsumedAt: new Date() } },
            { new: true }
        );

        if (consumed) {
            console.log(`restart:check: restart consumed for ${machineName}`);
            resp.status(200).send({ restart: true, machineName });
            return;
        }

        // No restart pending: just register the ping (upsert so first ping creates the record)
        await RestartRequest.findOneAndUpdate(
            { machineName },
            { $set: { lastPingAt: new Date() }, $setOnInsert: { restartFlag: 0 } },
            { upsert: true }
        );
        resp.status(200).send({ restart: false, machineName });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
});

/**
 * Call this (e.g. from a browser/curl) to request a restart of the given machine.
 */
restartRoute.post('/trigger/:machineName', async (req: any, resp: any) => {
    try {
        const machineName = req.params.machineName;
        const updated = await RestartRequest.findOneAndUpdate(
            { machineName },
            { $set: { restartFlag: 1, lastRestartTriggeredAt: new Date() } },
            { upsert: true, new: true }
        );
        console.log(`restart:trigger: restart requested for ${machineName}`);
        resp.status(200).send({ response: updated });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
});

/**
 * View current status of all machines (or one via ?machineName=X)
 */
restartRoute.get('/status', async (req: any, resp: any) => {
    try {
        const machineName = req.query.machineName;
        const filter = machineName ? { machineName } : {};
        const items = await RestartRequest.find(filter).sort({ updatedAt: -1 });
        resp.status(200).send({ response: items });
    }
    catch (err: any) {
        console.log('Error', err);
        resp.status(500).send(err);
    }
});
