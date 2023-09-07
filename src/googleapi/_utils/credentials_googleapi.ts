import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const CONFS = process.env// Set up OAuth2 credentials
export const _credentials = {
    client_id: CONFS.client_id,
    client_secret: CONFS.client_secret,
    redirect_uris: [CONFS.redirect_uris],
};
