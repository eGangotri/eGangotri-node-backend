export const SHEET_NAME = "Sheet 1";

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const PDF_MIME_TYPE = 'application/pdf';
export const JPEG_MIME_TYPE = 'image/jpeg';
export const JPG_MIME_TYPE = 'image/jpg';
export const PNG_MIME_TYPE = 'image/png';
export const GIF_MIME_TYPE = 'image/gif';

export const ALLOWED_MIME_TYPES_FOR_RENAMING = [PDF_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE, PNG_MIME_TYPE,GIF_MIME_TYPE];

export const ZIP_MIME_TYPE = 'application/zip';

export const PDF_TYPE = 'pdf';
export const ZIP_TYPE = 'zip';
export const ALL_TYPE = 'all';


export const numPages = "No. of Pages"
export const titleInGoogleDrive = "Title in Google Drive"
export const linkToFileLocation = "Link to File Location"
export const linkToTruncatedFileLocation = "Link to Truncated File Location";
export const bookOrManuscript = "Book / Manuscript"

export const titleInEnglish = "Title in English";
export const titleInOriginal = "Title in Original Script ( Devanagari etc )";
export const subTitle = "Sub-Title";
export const author = "Author";
export const editor = "Commentator/ Translator/Editor";
export const language = "Language(s)";
export const script = "Script";
export const subject = "Subject/ Descriptor";
export const publisher = "Publisher";
export const edition = "Edition/Statement";
export const placeOfPubliation = "Place of Publication";
export const yearOfPublication = "Year of Publication";
export const isbn = "ISBN";
export const remarks = "Remarks";
export const thumbnail = "Thumbnail";
export const folderName = "Folder Name";

export const CSV_SEPARATOR = ";"
export const SEPARATOR_SPECIFICATION = `sep=${CSV_SEPARATOR}\n`

export const MAX_FILE_NAME_LENGTH = 160
export const emptyExcelHeaderObj = {
    "S.No": '',
    [titleInGoogleDrive]: "",
    [linkToFileLocation]: "",
    [linkToTruncatedFileLocation]: "",
    [bookOrManuscript]: "",
    [titleInEnglish]: "",
    [titleInOriginal]: "",
    [subTitle]: "",
    [author]: "",
    [editor]: "",
    [language]: "",
    [script]: "",
    [subject]: "",
    [publisher]: "",
    [edition]: "",
    [placeOfPubliation]: "",
    [yearOfPublication]: "",
    [numPages]: "",
    [isbn]: "",
    [remarks]: "",
    "Commentairies": "",
    "Commentator": "",
    "Series ( KSTS/Kavyamala/Chowkhamba etc": "",
    "Size with Units": "",
    "Size in Bytes": "",
    [folderName]: "",
    [thumbnail]: "",
    "Created Time": ""
}

//Local Excel Title
export const LOCAL_FILE_NAME_HEADER = "File Name" 
export const TOTAL_FILE_SIZE_IN_KB = "Total File Size in KB";
export const FILE_SIZE = "File Size";
