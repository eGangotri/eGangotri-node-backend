import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as _ from 'lodash';
dotenv.config()
const CONFS = process.env

export let GLOBAL_DB_NAME = CONFS.MONGO_DB_NAME;
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
    
    // Handle local MongoDB connection (no auth required)
    if (!CONFS.MONGO_ATLAS_USER && !CONFS.MONGO_ATLAS_PWD) {
        const connectionString = `${_protocol}${CONFS.MONGO_DB_PATH}/${GLOBAL_DB_NAME}${_suffix}`;
        console.log(`Local MongoDB connection: ${connectionString}`);
        return connectionString;
    }
    
    // For remote MongoDB with authentication
    const connectionString = `${_protocol}${CONFS.MONGO_ATLAS_USER}:${CONFS.MONGO_ATLAS_PWD}@${CONFS.MONGO_DB_PATH}/${GLOBAL_DB_NAME}${_suffix}`;
    console.log(`MongoDB connection: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);
    return connectionString;
}
export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Extreme timeout settings for high latency VPN connections
    maxPoolSize: 20, // Further reduced to optimize connection management
    minPoolSize: 3,  // Reduced to minimize idle connections
    socketTimeoutMS: 1200000, // 20 minutes for long-running operations
    connectTimeoutMS: 300000, // 5 minutes for initial connection
    serverSelectionTimeoutMS: 300000, // 5 minutes for server selection
    heartbeatFrequencyMS: 180000, // 3 minutes between heartbeats to reduce overhead
    // Add localThresholdMS to prefer closer servers
    localThresholdMS: 5000, // Increased to be more lenient with latency
    // Additional options for high-latency connections
    bufferCommands: true, // Buffer commands when connection is lost
    autoIndex: false, // Don't build indexes automatically
    retryWrites: true, // Retry write operations
    retryReads: true, // Retry read operations
    waitQueueTimeoutMS: 300000, // 5 minutes to wait for a connection from the pool
    // Read preference settings
    readPreference: 'nearest', // Prefer nearest server to reduce latency
    readConcern: { level: 'available' }, // Accept potentially stale data for faster reads
    // Write concern settings
    w: 1, // Only require acknowledgment from primary
    j: false, // Don't require journal commit for faster writes
};
