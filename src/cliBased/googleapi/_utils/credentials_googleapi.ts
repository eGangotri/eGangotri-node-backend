import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
const CONFS = process.env// Set up OAuth2 credentials
export const _credentials = {
  client_id: CONFS.GOOGLE_DRIVE_CLIENT_ID,
  client_secret: CONFS.GOOGLE_DRIVE_CLIENT_SECRET,
  redirect_uris: [CONFS.GOOGLE_DRIVE_REDIRECT_URI],
};

export const GOOGLE_DRIVE_REFRESH_TOKEN = CONFS.GOOGLE_DRIVE_REFRESH_TOKEN;
export const SCOPES =
  (process.env.GOOGLE_DRIVE_API_SCOPE
    ? process.env.GOOGLE_DRIVE_API_SCOPE.split(',').map(s => s.trim()).filter(Boolean)
    : ['https://www.googleapis.com/auth/drive']);

export const TOKEN_PATH = './token.json'; // Path to store the token
