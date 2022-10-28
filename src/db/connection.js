"use strict";
exports.__esModule = true;
exports.connection_config = void 0;
var configData = require("../config.json");
var mongoAtlasConfigs = require("../pwd.json");
var prod = configData.prod;
var DB_NAME = 'archive_upload_monitor';
var DB_HOST = prod ? configData.AZURE_DB_HOST : configData.DEV_DB_HOST;
var DB_PORT = prod ? configData.AZURE_DB_PORT : configData.AZURE_DB_PORT;
var DB_PARAMS = prod ? configData.AZURE_DB_PARAMS : configData.AZURE_DB_PARAMS;
//const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}${DB_PARAMS}/${DB_NAME}`;
var MONGO_ATLAS_PWD = mongoAtlasConfigs.MONGO_ATLAS_PWD;
var MONGO_ATLAS_USER = mongoAtlasConfigs.MONGO_ATLAS_USER;
var MONGO_DB_PROTOCOL = mongoAtlasConfigs.MONGO_DB_PROTOCOL;
var MONGO_DB_PATH = mongoAtlasConfigs.MONGO_DB_PATH;

var DB_URL = `${MONGO_DB_PROTOCOL}${MONGO_ATLAS_USER}:${MONGO_ATLAS_PWD}${MONGO_DB_PATH}`
"mongodb+srv://egangotri:".concat(MONGO_ATLAS_PWD, "@cluster0.yqcrz.mongodb.net/?retryWrites=true&w=majority");

/***
 * In Mongo Compass use:
 *
 mongodb://egangotri:bcWbOF0rPGAU4BhJJdlGjVTdbs1xAboMl9poX68Qm4UOMusvdGds4JNxRPTb3RzqLaXoAGEI80H5P49dIfnmcg==@egangotri.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@egangotri@
 */
exports.connection_config = {
    DB_NAME: DB_NAME,
    DB_URL: DB_URL,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
};
