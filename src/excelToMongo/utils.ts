import { extractGoogleDriveId } from "../mirror/GoogleDriveUtilsCommonCode";

export const ArchiveExcelHeaderToJSONMAPPING = {
    'Serial No.': 'serialNo',
    Link: 'link',
    'All Downloads Link Page': 'allDownloadsLinkPage',
    'Pdf Download Link': 'pdfDownloadLink',
    'Page Count': 'pageCount',
    'Original Title': 'originalTitle',
    'Title-Archive': 'titleArchive',
    Size: 'size',
    'Size Formatted': 'sizeFormatted',
    Subject: 'subject',
    Description: 'description',
    Date: 'date',
    Acct: 'acct',
    Identifier: 'identifier',
    Type: 'type',
    'Media Type': 'mediaType',
    'Email-User': 'emailUser'
}

export const GoogleDriveExcelHeaderToJSONMAPPING = {

    "S.No": 'serialNo',
    "Title in Google Drive": 'titleGDrive',
    "Link to File Location": 'gDriveLink',
    "Link to Truncated File Location": 'truncFileLink',
    "Book / Manuscript": 'textType',
    "Title in English": 'titleinEnglish',
    "Title in Original Script ( Devanagari etc )": 'titleOriginalScript',
    "Sub-Title": 'subTitle',
    "Author": 'author',
    "Commentator/ Translator/Editor": 'editor',
    "Language(s)": 'languages',
    "Script": 'script',
    "Subject/ Descriptor": 'subect',
    "Publisher": 'publisher',

    "Edition/Statement": 'edition',
    "Place of Publication": 'placePub',
    "Year of Publication": 'yearPub',
    "No. of Pages": 'pageCount',
    "ISBN": 'isbn',
    "Remarks": 'remarks',
    "Commentairies": 'commentaries',
    "Commentator": 'commentator',
    "Series ( KSTS/Kavyamala/Chowkhamba etc": 'series',
    "Size with Units": 'sizeWithUnits',
    "Size in Bytes": 'sizeInBytes',
    "Folder Name": 'folderName',
    "Thumbnail": 'thumbnail',
    "Created Time": 'createdTime',
}

const replaceExcelHeadersWithJsonKeys = (data: Object[], mapping: Object, source: string = "") => {
    const jsonObj = data.map((row: Object) => {
        const newRow = {};
        Object.keys(row).forEach((key) => {
            const dataRowKeyCorrespondingValue = row[key]
            const jsonHeader = mapping[key]
            newRow[jsonHeader] = dataRowKeyCorrespondingValue;
            if (jsonHeader === 'pageCount') {
                newRow[jsonHeader] = newRow[jsonHeader] || 0;
            }
            if (jsonHeader === 'gDriveLink') {
                newRow["identifier"] = extractGoogleDriveId(dataRowKeyCorrespondingValue);
            }
            if (jsonHeader === 'truncFileLink') {
                newRow["identifierTruncFile"] = extractGoogleDriveId(dataRowKeyCorrespondingValue);
            }
        });
        if (source.length > 0) {
            newRow["source"] = source;
        }
        return newRow;
    });
    return jsonObj
}

export const replaceExcelHeadersWithJsonKeysForArchiveItem = (data: Object[], mapping: Object, source: string) => {
    const jsonObj = replaceExcelHeadersWithJsonKeys(data,mapping,source)
    return jsonObj.filter((row: Object) => {
        return row['serialNo'] !== "" || row['originalTitle'] !== "";
    });
}


export const replaceExcelHeadersWithJsonKeysForGDriveItem = (data: Object[], mapping: Object, source: string) => {
    const jsonObj = replaceExcelHeadersWithJsonKeys(data,mapping,source)
    return jsonObj.filter((row: Object) => {
        return row['serialNo'] !== "" || row['gDriveLink'] !== "";
    });
}

export const printMongoTransactions = (res: any, error = false) => {
    const msg = `Number of documents inserted (${error ? 'with duplication-filtering' : 'without error'}): 
    insertedCount: ${res.insertedCount}
    matchedCount ${res.matchedCount}
    modifiedCount: ${res.modifiedCount}
    deletedCount: ${res.deletedCount}
    upsertedCount: ${res.upsertedCount}
    upsertedIds count: ${Object.keys(res?.upsertedIds || {})?.length}
    insertedIds Intended count: ${Object.keys(res?.insertedIds || {})?.length}
    insertedIds Intended count: ${JSON.stringify(res)}
    `
    console.log(msg);
}
