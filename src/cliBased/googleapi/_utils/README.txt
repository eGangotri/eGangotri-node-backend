To obtain the necessary Google credentials (such as the client_id, client_secret, redirect_uri, and refresh_token), you'll need to set up a Google Cloud Platform project and enable the Google Drive API. Here's a step-by-step guide on how to do that:

Go to the Google Cloud Console and create a new project.

In the sidebar, navigate to "APIs & Services" -> "Library" and search for "Google Drive API". Click on it and enable the API for your project.

In the sidebar, go to "APIs & Services" -> "Credentials".

Click on "Create Credentials" and select "OAuth client ID".

Choose the application type as "Web application".

Enter a name for your OAuth 2.0 client, and under "Authorized JavaScript origins", add the redirect URI for your application (e.g., http://localhost:3000).

Under "Authorized redirect URIs", add the redirect URI where you plan to handle the OAuth flow (e.g., http://localhost:3000/callback).

Click on "Create", and you'll see the client ID and client secret on the credentials page.

To obtain the refresh_token, you'll need to perform the OAuth flow. Here's an example of how to do it programmatically using the googleapis library:


/*Code Starts*/
import { google } from 'googleapis';

// Set up OAuth2 credentials
const credentials = {
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET',
  redirect_uris: ['YOUR_REDIRECT_URI'],
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
const code = 'AUTHORIZATION_CODE';

oauth2Client.getToken(code, (err, token) => {
  if (err) {
    console.error('Error getting access token:', err);
    return;
  }

  console.log('Refresh Token:', token.refresh_token);
});
/*Code ends*/


In this example, replace 'YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET', and 'YOUR_REDIRECT_URI' with the corresponding values from your Google Cloud Console project.

When you run the code above, it will print an authorization URL. Open that URL in a browser, sign in with your Google account, and grant access to the requested permissions. After granting access, you'll be redirected to the redirect URI you specified, and the code will appear in the URL. Copy that code and provide it as the AUTHORIZATION_CODE in the code snippet.

After executing the code, the refresh token will be printed in the console. Store this refresh token securely, as it's used to authenticate requests to the Google Drive API.

With the obtained client_id, client_secret, redirect_uri, and refresh_token, you can now use them in the previous code snippet to read a folder and list its contents programmatically.
