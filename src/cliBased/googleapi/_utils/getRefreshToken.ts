import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as readline from 'readline';
import * as fsPromise from 'fs/promises';
import * as path from 'path';

import { SCOPES, TOKEN_PATH, _credentials } from './credentials_googleapi';
import { checkFolderExistsSync } from '../../../utils/FileUtils';

// Set up OAuth2 credentials
const REFRESH_TOKEN_V2_CREDENTIALS = {
    ..._credentials
};

// Load credentials and authorize the client
async function authorize(): Promise<OAuth2Client> {
    const oAuth2Client = new google.auth.OAuth2(
        REFRESH_TOKEN_V2_CREDENTIALS.client_id,
        REFRESH_TOKEN_V2_CREDENTIALS.client_secret,
        REFRESH_TOKEN_V2_CREDENTIALS.redirect_uris[0]
    );
    await getNewToken(oAuth2Client);
    return oAuth2Client;
}

// Get and store new token after prompting for user authorization.
async function getNewToken(oAuth2Client: OAuth2Client): Promise<void> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    // After the user authorizes, Google will provide a code.
    const code = await getCodeFromUser();

    const tokenResponse = await oAuth2Client.getToken(code);
    console.log(`tokenResponse: ${JSON.stringify(tokenResponse)}`);
    oAuth2Client.setCredentials(tokenResponse.tokens);
    await fsPromise.writeFile(TOKEN_PATH, JSON.stringify(tokenResponse.tokens));
    console.log('Token stored to', TOKEN_PATH);
}

// Get the code from user input
async function getCodeFromUser(): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            resolve(code);
        });
    });
}


const updateDotEnvRefreshToken = async () => {
    const tokenPath = path.resolve(process.cwd(), 'token.json');
    const envPath = path.resolve(process.cwd(), '.env');
    const stat = await fsPromise.stat(tokenPath);
    const tokenRaw = await fsPromise.readFile(tokenPath, 'utf-8');
    const tokenJson = JSON.parse(tokenRaw);
    const refreshToken: string | undefined = tokenJson?.refresh_token;
    console.log(`token.json last modified (local): ${stat.mtime.toISOString()}`);
    console.log(`refresh_token: ${refreshToken}`);

    // Read existing .env and capture old value
    let envRaw = '';
    try {
        envRaw = await fsPromise.readFile(envPath, 'utf-8');
    } catch { }
    let oldValue = '';
    const match = envRaw.match(/^GOOGLE_DRIVE_REFRESH_TOKEN=(.*)$/m);
    if (match) {
        oldValue = match[1];
    }

    let newEnv = envRaw;
    if (match) {
        newEnv = envRaw.replace(/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m, `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken ?? ''}`);
    } else {
        const sep = envRaw.endsWith('\n') || envRaw.length === 0 ? '' : '\n';
        newEnv = envRaw + sep + `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken ?? ''}` + '\n';
    }
    await fsPromise.writeFile(envPath, newEnv, 'utf-8');
    console.log(`Replacing GOOGLE_DRIVE_REFRESH_TOKEN: ${oldValue} -> ${refreshToken}`);
}

// Main function
export const refreshGdriveToken = async () => {
    try {
        console.log(`getRefreshTokens: ${new Date()}`);
        console.log(`Warning. You must have your Root GMAIL Acct (***foundation@gmail.com) accessible in the system you are running this from: ${new Date()}`);
        const auth = await authorize();
        await updateDotEnvRefreshToken();

    } catch (err) {
        console.error('Failed to process token.json or update .env', err);
    }
}

refreshGdriveToken().catch(console.error);
