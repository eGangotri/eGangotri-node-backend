### Google Auth
In Order to be able to read/write Google Drive Files, we need to perform the following steps:

Step 1 in Google Cloud Console (1 Time Only)
Create a Google Cloud Project in Google Cloud Console.

In the sidebar, navigate to "APIs & Services" -> "Library" and search for "Google Drive API". Click on it and enable the API for your project.

Create a Google Client
https://console.cloud.google.com/auth/clients?project=hardy-ivy-388117


In the sidebar, go to "APIs & Services" -> "Credentials".

Click on "Create Credentials" and select "OAuth client ID".

Choose the application type as "Web application".

Enter a name for your OAuth 2.0 client, and under "Authorized JavaScript origins", add the redirect URI for your application 
(e.g., http://localhost:3000).

Under "Authorized redirect URIs", add the redirect URI where you plan to handle the OAuth flow (e.g., http://localhost:3000/callback).


Copy Client ID and Client Secret Redirect URL and paste to .env

GOOGLE_DRIVE_CLIENT_ID=XXXXXX.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/callback

Step 2 for configuring GOOGLE API WRITE Permissions

Unlike Read permissions, Write permissions need to be configured in Google Cloud Console with things like a youtube video explanation etc.

In APIs&Lib->Oauth COnsent Screen:

at 
Google Cloud Console
https://console.cloud.google.com/auth/scopes?project=hardy-ivy-XXXXXX
Choose Scope:

https://www.googleapis.com/auth/drive

.../auth/drive	
See, edit, create, and delete all of your Google Drive files

Permissions:
https://egf-skt.github.io/egf-tools/index.html
Youtube submission:
https://www.youtube.com/watch?v=y2qsBTW1ixM


https://console.cloud.google.com/auth/overview?project=hardy-ivy-388117
Publishing Status 
Test.



Step 3. In Codebase. Getting Refresh Token.
execute in terminal: pnpm run get-refresh-token


you will see following in terminal:


Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&client_id=293852274152-q8poha9rrju4la4s9tp72n5jkvlsjerh.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback
Enter the code from that page here:



Copy-Paste the URL to Chrome. Make sure it is opened/logged with the original email address which you used to create the Google Cloud Console OAuth Client.

Upon authentication the browswe with a blank window will have the following URL

http://localhost:3000/callback?code=4/0AVGzR1Aj6c8JJyzixbKXog************************M6xXx67Fm9HaCTJVttZRRwBANhfObGw-ew&scope=https://www.googleapis.com/auth/drive.file

//copy the portion between code= and &scope=.

Paste the Code in the CLI input 
Enter the code from that page here:

You will see the following instructions

Token stored to ./token.json
File ID: undefined


Go to ./token.json and copy the refresh_token that will start with 1//

paste it in .env file as GOOGLE_DRIVE_REFRESH_TOKEN

