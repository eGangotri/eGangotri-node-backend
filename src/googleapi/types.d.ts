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

export interface ExcelHeaders {
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

type PdfFolderTitleType = {
    folder: string,
    fileName: string
}