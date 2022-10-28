const configData = require("../config.json");
const MONGO_CONFIGS = require("../pwd.json");

//mongodb+srv://<username>:<password>@cluster0.yqcrz.mongodb.net/?retryWrites=true&w=majority

export const MONGO_DB_URL = `${MONGO_CONFIGS.MONGO_DB_PROTOCOL}${MONGO_CONFIGS.MONGO_ATLAS_USER}:${MONGO_CONFIGS.MONGO_ATLAS_PWD}@${MONGO_CONFIGS.MONGO_DB_PATH}`;

export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};


export const MONGO_DB_NAME = "test";
/***
 * In Mongo Compass use:
 * 
 mongodb://egangotri:bcWbOF0rPGAU4BhJJdlGjVTdbs1xAboMl9poX68Qm4UOMusvdGds4JNxRPTb3RzqLaXoAGEI80H5P49dIfnmcg==@egangotri.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@egangotri@
 */

const prod = configData.prod;

const DB_URL = `mongodb+srv://egangotri:${MONGO_CONFIGS.MONGO_ATLAS_PWD}@cluster0.yqcrz.mongodb.net/?retryWrites=true&w=majority`;
const DB_HOST = prod ? configData.AZURE_DB_HOST : configData.DEV_DB_HOST;
const DB_PORT = prod ? configData.AZURE_DB_PORT : configData.AZURE_DB_PORT;
const DB_PARAMS = prod
? configData.AZURE_DB_PARAMS
: configData.AZURE_DB_PARAMS;
//const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}${DB_PARAMS}/${DB_NAME}`