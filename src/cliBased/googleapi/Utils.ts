import { GDRIVE_DEFAULT_IGNORE_FOLDER } from "../../services/GDriveService";
import { ALL_TYPE, FOLDER_MIME_TYPE, PDF_MIME_TYPE, PDF_TYPE, ZIP_MIME_TYPE, ZIP_TYPE } from "./_utils/constants";

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


export const constructGoogleApiQuery = (folderId: string, ignoreFolder: string, fileType: string) => {
    const pdfOnly = fileType === PDF_TYPE;
    const zipOnly = fileType === ZIP_TYPE;
    const all = fileType.toLowerCase() === ALL_TYPE || (fileType !== PDF_TYPE && fileType !== ZIP_TYPE);

    const buildContains = (v: string) => `name contains '${v.replace(/'/g, "\\'")}'`;
    let conditionForIgnoreFolder = ignoreFolder?.length > 0 ? ` and not name contains '${ignoreFolder}'` : "";

    if (ignoreFolder && ignoreFolder.length > 0 && ignoreFolder === GDRIVE_DEFAULT_IGNORE_FOLDER) {
        conditionForIgnoreFolder = ` and not (${buildContains(ignoreFolder)}${['proce', 'procl']
            .map(ex => ` and not ${buildContains(ex)}`)
            .join('')
            })`
    }

    const pdfOnlyFrag = `(mimeType='${PDF_MIME_TYPE}' or mimeType='${FOLDER_MIME_TYPE}')`
    const zipOnlyFrag = `((mimeType='${ZIP_MIME_TYPE}' or name contains '.zip' or name contains '.rar') or mimeType='${FOLDER_MIME_TYPE}')`
    const combinedCondition = (pdfOnly || zipOnly) ?
        ` and ${pdfOnly ? pdfOnlyFrag : zipOnlyFrag}`
        : ` and (mimeType!='' or  mimeType='${FOLDER_MIME_TYPE}')`;

    const _query = `'${folderId}' in parents and trashed = false ${combinedCondition} ${conditionForIgnoreFolder} `
    let idx = 0
    console.log(`_query(${++idx}) ${_query}`)
    return _query;

}