import * as dotenv from 'dotenv'
import * as mongoose from 'mongoose';
dotenv.config()
const CONFS = process.env

export const RESTART_DB_NAME = CONFS.RESTART_MONGO_DB_NAME || "restartDB";

export const restartMongoDbUrl = () => {
    const _protocol = CONFS.RESTART_MONGO_DB_PROTOCOL || "mongodb+srv://";
    const _suffix = CONFS.RESTART_MONGO_DB_SUFFIXES || "?retryWrites=true&w=majority";

    // Handle local MongoDB connection (no auth required)
    if (!CONFS.RESTART_MONGO_ATLAS_USER && !CONFS.RESTART_MONGO_ATLAS_PWD) {
        return `${_protocol}${CONFS.RESTART_MONGO_DB_PATH}/${RESTART_DB_NAME}${_suffix}`;
    }

    return `${_protocol}${CONFS.RESTART_MONGO_ATLAS_USER}:${CONFS.RESTART_MONGO_ATLAS_PWD}@${CONFS.RESTART_MONGO_DB_PATH}/${RESTART_DB_NAME}${_suffix}`;
}

let restartConnection: mongoose.Connection | null = null;

export const getRestartConnection = (): mongoose.Connection => {
    if (!restartConnection) {
        const url = restartMongoDbUrl();
        console.log(`Restart DB connection: ${url.replace(/:([^:@]+)@/, ':****@')}`);
        restartConnection = mongoose.createConnection(url, {
            serverSelectionTimeoutMS: 60000,
            retryWrites: true,
        });
        restartConnection.on('connected', () => {
            console.log(`Restart DB: Connected (${RESTART_DB_NAME})`);
        });
        restartConnection.on('error', (err) => {
            console.error('Restart DB: Connection error:', err);
        });
    }
    return restartConnection;
}
