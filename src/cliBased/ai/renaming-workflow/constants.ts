export const AI_RENAMING_WORKFLOW_CONFIG = {
    inputFolders: ["C:\\tmp\\Box- 2\\reduced\\Box- 2(12)"],
    outputFolder: "C:\\tmp\\Box- 2\\reduced\\Box- 2(12)\\renamed", // Set to a path to copy renamed files to a new location
    batchSize: 3,       // Number of PDFs to process in a batch (reduced to avoid rate limits)
    dryRun: false,      // Set to true to see what would be renamed without actually renaming
    renameInPlace: false, // Set to false to copy files to outputFolder instead of renaming in place
    delayBetweenCallsMs: 2000,  // Wait 2 seconds between API calls
    delayBetweenBatchesMs: 10000  // Wait 10 seconds between batches
}


// Google AI Studio prompt for metadata extraction
export  const METADATA_EXTRACTION_PROMPT = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts
 and sometimes Urdu.

Print the followwing details in Title Case

Title Author Language Year - Publisher in One Line in English only. The Hyphen will separate the main text from the Publisher

If any entry is not visible then just leave it blank. 

if author/title is not known then instead print Unknown.

Make sure to only write the metadata not things like Title: etc.

If there is no publisher then make the author the last entry preceeded by hyphen 

So :

Title Language Year - Author in One Line in English only. 

If there is publisher then make the publisher the last entry.

Only Author or Publisher can be the last entry and should be preceeded by a hyphen. 

Never make title year etc the last entry. and there should never be a hyphen preceeding them, it is reserved for publisher or author.

If there is a publisher and there is a title and author , the title and author should be separated by " By ".

Dont use any quotes in the the result , example if name is O'Donnell then remove the quotes.
if this is a magazine then Issue No Volume No year month , ciruclation cycle example bimonthly, trimonthly should be also shown and the word Magazine or Journal should display before the year
No diacritics should be ever used. Just plain ASCII characters and conventional spellings of Sanskrit and other languages

If the year is in Vikrami or Samvat or Shaka or any other Calendar such as Bengali Calendar or Gujarati Calendar then convert it to Common Era Year.

If the words are in Sanskrit and they are conjoined like Shishupalavadha due to the rules of Sanskrit compunding called Samasa separate them so that they are more online search friendly to something like Shishupala Vadha which will be easier for a modern reader to find in online searched.

If you feel any pages in the front or back are missing, then you can add the text Missing Pages before the year to let the reader know he is in for some minor inconvenience

If metadata  is missing in the front due to missing pages then try the last few pages to find the metadata. 

Sometimes front pages are missing but last pages have the information.

ignore comas

If the publisher has address info such Penguin India drop the portion that will describe the country

ignore the pdf-header and pdf-footers which if provided is merely ascribing the custodians or scanning agencies which is irrelevant to our metadata extraction of the book`;
