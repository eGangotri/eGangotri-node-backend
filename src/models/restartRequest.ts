import * as mongoose from 'mongoose';
import { getRestartConnection } from '../db/restartConnection';

const schema = new mongoose.Schema(
    {
        machineName: { type: String, required: true, unique: true },
        restartFlag: { type: Number, default: 0 },
        lastPingAt: { type: Date },
        lastRestartTriggeredAt: { type: Date },
        lastRestartConsumedAt: { type: Date },
    }, {
    collection: 'RestartRequest',
    timestamps: true
}
);

export const RestartRequest = getRestartConnection().model('RestartRequest', schema);
