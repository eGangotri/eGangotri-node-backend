const configData = require("../config.json");


const prod = configData.prod;

const DB_NAME = 'archive_upload_monitor';
const DB_HOST = prod?configData.AZURE_DB_HOST:configData.DEV_DB_HOST;
const DB_PORT = prod?configData.AZURE_DB_PORT:configData.AZURE_DB_PORT;
const DB_PARAMS =  prod?configData.AZURE_DB_PARAMS:configData.AZURE_DB_PARAMS;

const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}${DB_PARAMS}/${DB_NAME}`;

export const connection_config = {
    DB_NAME,
    DB_URL,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }
}