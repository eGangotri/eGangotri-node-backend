export interface GoogleApiData {
    index: number,
    fileName: string,
    googleDriveLink: string,
    sizeInfo: string,
    fileSizeRaw: string,
    parents: string,
    createdTime: string,
    thumbnailLink: string,
}

export interface GoogleApiDataWithLocalData extends GoogleApiData {
    localAbsPath?: string;
    success?: boolean;
}

export interface GDriveExcelHeaders {
    "S.No": number | string;
    "Title in Google Drive": string;
    "Link to File Location": string;
    "Link to Truncated File Location": string;
    "Book / Manuscript": string;
    "Title in English": string;
    "Title in Original Script ( Devanagari etc )": string;
    "Sub-Title": string;
    "Author": string;
    "Commentator/ Translator/Editor": string;
    "Language(s)": string;
    "Script": string;
    "Subject/ Descriptor": string;
    "Publisher": string;
    "Edition/Statement": string;
    "Place of Publication": string;
    "Year of Publication": string;
    "No. of Pages": string | number;
    "ISBN": string;
    "Remarks": string;
    "Commentairies": string;
    "Commentator": string;
    "Series ( KSTS/Kavyamala/Chowkhamba etc": string;
    "Size with Units": string;
    "Size in Bytes": string;
    "Folder Name": string;
    "Thumbnail": string;
    "Created Time": string;
}

export interface GDriveExcelHeadersFileRenamerV2 {
    "S.No": number | string;
    "Title in Google Drive": string;
    "Link to File Location": string;
    "Title in English": string;
    "Sub-Title": string;
    "Author": string;
    "Commentator/ Translator/Editor": string;
    "Language(s)": string;
    "Subject/ Descriptor": string;
    "Publisher": string;
    "Edition/Statement": string;
    "Place of Publication": string;
    "Year of Publication": string;
    "Composite Title": string;
    "Orig Name": string;
    "Folder Name": string;
    "Thumbnail": string;
}
export interface LocalFileHeaders {
    "Serial No.": string,
    "File Name": string,
    "Number of Pages": number,
    "File Size": string,
    "Units": string,
    "Total File Size in KB": number,
}

export interface GDriveExcelData {
    sNo: number | string;
    titleInGoogleDrive: string;
    linkToFileLocation: string;
    linkToTruncatedFileLocation: string;
    bookManuscript: string;
    titleInEnglish: string;
    titleInOriginalScriptDevanagariEtc: string;
    subTitle: string;
    author: string;
    commentatorTranslatorEditor: string;
    languages: string;
    script: string;
    subjectDescriptor: string;
    publisher: string;
    editionStatement: string;
    placeOfPublication: string;
    yearOfPublication: string;
    noOfPages: string | number;
    isbn: string;
    remarks: string;
    commentairies: string;
    commentator: string;
    seriesKstsKavyamalaChowkhambaEtc: string;
    sizeWithUnits: string;
    sizeInBytes: string;
    folderName: string;
    thumbnail: string;
    createdTime: string;
}