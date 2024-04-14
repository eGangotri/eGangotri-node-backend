const { google } = require('googleapis');

export function isValidDriveId(folderIdOrUrl: string) {
    if (folderIdOrUrl.startsWith("http")) {
        return folderIdOrUrl.includes("google.com/");
    }
    else if (folderIdOrUrl.match(/^1[A-Za-z0-9-_]{32}$/)) {
        return true;
    }
    else false;
}

