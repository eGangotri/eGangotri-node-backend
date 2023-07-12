import { google } from 'googleapis';
import { _credentials } from './credentials_gitignore';

// Set up OAuth2 credentials
const credentials = {
   ..._credentials
};

// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.readonly'],
});

console.log('Authorize this app by visiting the following URL:');
console.log(authUrl);

// After authorizing the app, you'll receive a code. Use it to get the refresh token
//http://localhost:3000/callback?code=4/0AZEOvhXQYTof95edPDJ2eEH-9atjlt_05AOadgGuRa8jYvYsCMaRgGaq2wNGJI0bvchzkA&scope=https://www.googleapis.com/auth/drive.readonly
const code = '4/0AZEOvhXQYTof95edPDJ2eEH-9atjlt_05AOadgGuRa8jYvYsCMaRgGaq2wNGJI0bvchzkA';

oauth2Client.getToken(code, (err, token) => {
  if (err) {
    console.error('Error getting access token:', err);
    return;
  }

  console.log('Refresh Token:', token?.refresh_token);
});
