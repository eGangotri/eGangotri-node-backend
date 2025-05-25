import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as _ from 'lodash';
dotenv.config()
const CONFS = process.env

export let GLOBAL_DB_NAME = CONFS.MONGO_DB_NAME;
export const AI_SERVER = CONFS.AI_SERVER;
export let GLOBAL_SERVER_NAME = CONFS.SERVER_URL;
export const PYTHON_SERVER_URL = CONFS.PYTHON_SERVER_URL;

export const mongoDbUrlWithDbName = (dbName: string) => {
    if (dbName === "forUpload") {
        GLOBAL_DB_NAME = CONFS.MONGO_DB_NAME_FOR_UPLOAD || ""
    }
    else {
        GLOBAL_DB_NAME = CONFS.MONGO_DB_NAME || ""
    }

    const _protocol = CONFS.MONGO_DB_PROTOCOL || "mongodb+srv://";
    const _suffix = CONFS.MONGO_DB_SUFFIXES || "?retryWrites=true&w=majority";
    console.log(`${_protocol}${CONFS.MONGO_ATLAS_USER}:${CONFS.MONGO_ATLAS_PWD}@${CONFS.MONGO_DB_PATH}/${GLOBAL_DB_NAME}${_suffix}`)
    return `${_protocol}${CONFS.MONGO_ATLAS_USER}:${CONFS.MONGO_ATLAS_PWD}@${CONFS.MONGO_DB_PATH}/${GLOBAL_DB_NAME}${_suffix}`;
}
export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Extreme timeout settings for high latency VPN connections
    maxPoolSize: 30, // Reduced from 50 to avoid connection overhead
    minPoolSize: 5,  // Reduced from 10
    socketTimeoutMS: 900000, // 15 minutes (increased from 10)
    connectTimeoutMS: 180000, // 3 minutes (increased from 2)
    serverSelectionTimeoutMS: 180000, // 3 minutes (increased from 2)
    heartbeatFrequencyMS: 120000, // 2 minutes (increased from 1 minute)
    // Add localThresholdMS to prefer closer servers
    localThresholdMS: 1000, // Increased to be more lenient with latency
    // Additional options for high-latency connections
    bufferCommands: true, // Buffer commands when connection is lost
    autoIndex: false, // Don't build indexes automatically
    retryWrites: true, // Retry write operations
    retryReads: true, // Retry read operations
    waitQueueTimeoutMS: 180000 // How long to wait for a connection from the pool
};
