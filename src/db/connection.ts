import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as _ from 'lodash';
dotenv.config()
const CONFS = process.env

export let GLOBAL_DB_NAME = CONFS.MONGO_DB_NAME;
export const AI_SERVER = CONFS.AI_SERVER;
export let GLOBAL_SERVER_NAME = CONFS.SERVER_URL;

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
};
