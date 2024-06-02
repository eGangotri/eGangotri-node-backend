import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as readline from 'readline';

import { SCOPES, TOKEN_PATH, _credentials } from './credentials_googleapi';

// Set up OAuth2 credentials
const credentials = {
    ..._credentials
};

// Create an OAuth2 client


// Load client secrets from a local file.

// Load credentials and authorize the client
async function authorize(): Promise<OAuth2Client> {
    // const credentialsX = JSON.parse(fs.readFileSync("credentials.json", 'utf-8'));
    // const { client_secret, client_id, redirect_uris } = credentialsX.installed;
    // console.log(client_secret, client_id, redirect_uris)
    const oAuth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
      );
   // new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
        oAuth2Client.setCredentials(JSON.parse(token));
    } else {
        await getNewToken(oAuth2Client);
    }

    return oAuth2Client;
}

// Get and store new token after prompting for user authorization.
async function getNewToken(oAuth2Client: OAuth2Client): Promise<void> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    // After the user authorizes, Google will provide a code.
    const code = await getCodeFromUser();

    const tokenResponse = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokenResponse.tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenResponse.tokens));
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

// Upload a file to Google Drive
async function uploadFile(auth: OAuth2Client): Promise<void> {
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get({
        fileId: '19yDfS-1m1QJ9m806fMFDTXlMyVcwdza_',
        fields: "name, parents",
    });

    console.log('File ID:', response.data?.id);
}

// Main function
async function main() {
    const auth = await authorize();
    await uploadFile(auth);
}

main().catch(console.error);
