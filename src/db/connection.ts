import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const CONFS = process.env
export const MONGO_DB_URL =
 `${CONFS.MONGO_DB_PROTOCOL}${CONFS.MONGO_ATLAS_USER}:${CONFS.MONGO_ATLAS_PWD}@${CONFS.MONGO_DB_PATH}/${CONFS.MONGO_DB_NAME}${CONFS.MONGO_DB_SUFFIXES}`;

export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
