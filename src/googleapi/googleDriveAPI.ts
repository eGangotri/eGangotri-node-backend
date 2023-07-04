import { google } from 'googleapis';

/**
 * Obtain the credentials JSON file:
Go to the Google Cloud Console (console.cloud.google.com).
Create a new project and enable the Google Drive API.
Create OAuth 2.0 credentials and download the JSON file.
 */
// Load the credentials from the JSON file
import credentials from './credentials.json';


// Create an OAuth2 client using the credentials
const client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);

// Set the access token
client.setCredentials({
  access_token: credentials.installed.access_token,
  refresh_token: credentials.installed.refresh_token,
  scope: credentials.installed.scope
});

// Create an instance of the Google Drive API
const drive = google.drive({ version: 'v3', auth: client });

// Function to get all file metadata in a folder
async function getFileMetadataInFolder(folderId: string) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(name, id, mimeType)'
    });

    const files = response.data.files;
    return files;
  } catch (error) {
    console.error('Error retrieving file metadata:', error.message);
    throw error;
  }
}

// Usage example
const folderId = 'YOUR_FOLDER_ID'; // Replace with the actual folder ID

getFileMetadataInFolder(folderId)
  .then((files) => {
    console.log('Files in the folder:');
    files.forEach((file: any) => {
      console.log('Name:', file.name);
      console.log('ID:', file.id);
      console.log('MIME Type:', file.mimeType);
      console.log('------------------------');
    });
  })
  .catch((error) => {
    console.error('Error:', error);
  });
