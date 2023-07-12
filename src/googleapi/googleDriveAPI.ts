import { google } from 'googleapis';
import { _credentials } from './credentials_gitignore';

// Set up OAuth2 credentials
const credentials = {
    ..._credentials,
  refresh_token: '1//0gNBMXupFzUULCgYIARAAGBASNwF-L9IrnF4rkWHpvRSV1TqBV7ujMRHZP-biHpMFJQvpWW-4e5dlNGlNyGfnCW0ywWv3XLkHtmc',  
};

// Create an OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris[0]
);

// Set the credentials for the OAuth2 client
oauth2Client.setCredentials({
  refresh_token: credentials.refresh_token,
});

// Create a new Google Drive instance
const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function listFolderContents(folderId: string) {
  try {
    // Retrieve the files from the folder
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(name, id, mimeType)',
    });

    // Display the files' information
    const files = res.data.files;
    if (files && files.length) {
      console.log('Files:');
      files.forEach((file: any) => {
        console.log(`${file.name} (${file.id}) - ${file.mimeType}\n
        https://drive.google.com/file/d/${file.id}/view?usp=drive_link`);
      });
    } else {
      console.log('No files found.');
    }
  } catch (err) {
    console.error('Error retrieving folder contents:', err);
  }
}

// Replace 'FOLDER_ID' with the ID of the folder you want to list
const folderId = '1pxxhV2BkyTZgq34InhTuwDh-szU0jvY4';
listFolderContents(folderId);
