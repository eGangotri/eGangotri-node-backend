const configData = require("../config.json");
const mongoAtlasConfigs = require("../pwd.json");

const prod = configData.prod;

const DB_NAME = 'archive_upload_monitor';
const DB_HOST = prod?configData.AZURE_DB_HOST:configData.DEV_DB_HOST;
const DB_PORT = prod?configData.AZURE_DB_PORT:configData.AZURE_DB_PORT;
const DB_PARAMS =  prod?configData.AZURE_DB_PARAMS:configData.AZURE_DB_PARAMS;

//const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}${DB_PARAMS}/${DB_NAME}`;
const MONGO_ATLAS_PWD = mongoAtlasConfigs.MONGO_ATLAS_PWD
const DB_URL = `mongodb+srv://egangotri:${MONGO_ATLAS_PWD}@cluster0.yqcrz.mongodb.net/?retryWrites=true&w=majority`;
/***
 * In Mongo Compass use:
 * 
 mongodb://egangotri:bcWbOF0rPGAU4BhJJdlGjVTdbs1xAboMl9poX68Qm4UOMusvdGds4JNxRPTb3RzqLaXoAGEI80H5P49dIfnmcg==@egangotri.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@egangotri@
 */

export const connection_config = {
    DB_NAME,
    DB_URL,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }
}