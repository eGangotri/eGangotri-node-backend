import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as _ from 'lodash';
dotenv.config()
const CONFS = process.env

export const mongoDbUrlWithDbName = (dbName: string) => {
    if (dbName === "forUpload") {
        dbName = CONFS.MONGO_DB_NAME_FOR_UPLOAD || ""
    }
    else {
        dbName = CONFS.MONGO_DB_NAME || ""
    }

    return `${CONFS.MONGO_DB_PROTOCOL}${CONFS.MONGO_ATLAS_USER}:${CONFS.MONGO_ATLAS_PWD}@${CONFS.MONGO_DB_PATH}/${dbName}${CONFS.MONGO_DB_SUFFIXES}`;
}
export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
