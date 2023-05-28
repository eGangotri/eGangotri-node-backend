import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const MONGO_CONFIGS = process.env
export const MONGO_DB_URL = `${MONGO_CONFIGS.MONGO_DB_PROTOCOL}${MONGO_CONFIGS.MONGO_ATLAS_USER}:${MONGO_CONFIGS.MONGO_ATLAS_PWD}@${MONGO_CONFIGS.MONGO_DB_PATH}`;

export const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
