import { drive_v3, google } from 'googleapis';
import { _credentials } from '../_utils/credentials_googleapi';

// Set up OAuth2 credentials
const credentials = {
    ..._credentials,
    refresh_token: '1//0gNBMXupFzUULCgYIARAAGBASNwF-L9IrnF4rkWHpvRSV1TqBV7ujMRHZP-biHpMFJQvpWW-4e5dlNGlNyGfnCW0ywWv3XLkHtmc',
};
let GOOGLE_DRIVE_INSTANCE: drive_v3.Drive

export const getGoogleDriveInstance = () => {
    if (!GOOGLE_DRIVE_INSTANCE) {
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
        GOOGLE_DRIVE_INSTANCE = google.drive({ version: 'v3', auth: oauth2Client });
    }
    return GOOGLE_DRIVE_INSTANCE
}
