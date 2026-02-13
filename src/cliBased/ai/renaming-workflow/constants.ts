import * as dotenv from 'dotenv';
import { AI_RENAMING_WORKFLOW_CONFIG } from './types';

// Load environment variables
dotenv.config();

export const PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT = 170;
// Google AI Studio prompt for metadata extraction
export const PDF_METADATA_EXTRACTION_PROMPT = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts
 and sometimes Urdu.

The output should be only ASCII letters (A-Z, a-z) and numbers (0-9) without exception. 
No Comma, colon, slashes , diacritics etc should be used.

Conventional English spellings of words in Sanskrit and other languages should be used.

Dont use Jy for ज्ञ use Gy instead.

Print the followwing details in Title Case

Title SubTitle Commentary Commentator Author Editor Translator Language Subject Publication City Year - Publisher in One Line in English only. 

The Hyphen will separate the main text from the Publisher

If any entry is not visible then just leave it blank. 

if author/title is not known then instead print Unknown.

If the Subject can be broadly guessed like Vedanta, Aesthetics etc it can be included, if uncertain can ignore.

Make sure to only write the metadata not things like Title: etc.

SubTitle is optional only if exists.
Commentary/Commentator also called Tika/Tikakar or Vyakhya/Vyakhyakar in Sanskrit is optional.
If exists then should be included

Same for Editor Translator

If book is completely in English then no need to mention language.

If there is no publisher then make the author the last entry preceeded by hyphen 

So :

Title Language Year - Author in One Line in English only. 

If there is publisher then make the publisher the last entry.

If there is no publisher then replace it by something like Series.

Example Kavyamala Series, Choukhamba Sanskrit Series, Vizianagaram Sanskrit Series, Kashmir Series of Text and Studies

This information is generally in the end when the text advertises other publications by the same publisher.

Only Author or Publisher or Series can be the last entry and should be preceeded by a hyphen. 

Never make title year etc the last entry. and there should never be a hyphen preceeding them, it is reserved for publisher or author.

If there is a publisher and there is a title and author , the title and author should be separated by " By ".

If Language is Sanskrit but script is not Devanagari then try to add the Script as well

If book seem to miss pages in the beginning or in the end add before the year or city or dash the text "Missing Pages".

Example 
Meghaduta by Kalidas Sanskrit in Tamil Script 1920 Chennai - Sharada Press

If Multiple languages exist such as Sanskrit Original with Translation then add all languages.

Example 
Meghaduta by Kalidas Sanskrit Translated into English by T Ganesan 1920 Chennai - Sharada Press


If there is a Editor of the Text different from the Author add Editor info 
Example
Raj Tarangini by Jonaraja Edited by Raghunath Singh Sanskrit 1960 Lucknow - Naval Kishore Press

If Publisher is not available then treat the Press as Publisher.
Example

Rati Rahasya Edited by Mike Magee Sanskrit 1982 - Venkateshwar Press

Oputput generated shount not exceed ${PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT} characters including spaces

If the original title in Hindi is like this for example:

कालिदास का आधुनिक हिंदी काव्य पर प्रभाव 
Author: जानकी नाथ
Publisher: रामनाथ ऐण्ड सन्ज़
Year: 2025
City: लखनऊ

instead of transliterating to Ramanath aind sanz use the official English Ramanath and Sons

So should result in following

Kalidas Ka Adhunik Hindi Kavya Par Prabhav by Janaki Nath 2025 Lucknow - Ramanath and Sons

Dont translate title into English ever just translieration.

if any Institutional publisher in the book has two names one in English and one in Sanskrit/Hindi etc like Oriental Research Institute and 'Prachya Vidya Shodha Kendra'
give preference to the English in the output. But only if the publisher is mentioned in its English form.

Example a Book might have 
Central Institute of Tibetan Studies (CITS) but also Kendriya Uccha Tibbati Shiksha Sansthan 

In this case the output should be Central Institute of Tibetan Studies.

Otherwise dont translate to English.

If there are multiple spellings possible in English, spelling for entries in Sanskrit Hindi etc, give preference to Conventional English spellings.

Example: Ram instead of Rama. Shiva instead of Siva or Shiv as per the English Conventions.


Dont use any quotes in the the result , example if name is O'Donnell then remove the quotes.
if this is a magazine
 then include Issue No., Volume No., year, month , ciruclation cycle 
Example bimonthly, trimonthly should be also shown 
and the word Magazine or Journal should display before the year.

If the year is in Vikrami or Samvat or Shaka or any other Calendar such as Bengali Calendar or Gujarati Calendar then convert it to Common Era Year.

If the words are in Sanskrit and they are conjoined like Shishupalavadha due to the rules of Sanskrit compunding called Samasa separate them so that they are more online search friendly to something like Shishupala Vadha which will be easier for a modern reader to find in online searched.

If you feel any pages in the front or back are missing, 
then you can add the text Missing Pages 
before the year or city of publication but not before the title 
to let the reader know he is in for some minor inconvenience

If metadata  is missing in the front due to missing pages then try the last few pages to find the metadata. 

Sometimes front pages are missing but last pages have the information.

ignore comas

If the publisher has address info such Penguin India drop the portion that will describe the country

ignore the pdf-header and pdf-footers which if provided is merely ascribing the custodians or scanning agencies which is irrelevant to our metadata extraction of the book`;

export const SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT_CHAR_LIMIT = 40
export const SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT = `
This is an exercise to extract the title and author of the Cover Page of a book saved as a one page pdf/jpeg/png file.

If the Image is not a cover-page of book or manuscript but a stack of books then return NIL.

Output must be limited to ASCII letters (A-Z, a-z), spaces, and the hyphen (-). Do not use any other symbols or diacritics.

The output should be in Title Case.

The output should be in one line.

The output should be in the English script only.

The output should be in the format: Title - Author - Language - Series OR Publisher

For Non-English language books the Title should capture the original Title in the English Script no translation

The Language or Script should be in 2 Alphabet ISO 639-1 format.

Conventional English spellings of words in Sanskrit and other languages should be used.

Example: Ram instead of Rama. Shiva instead of Siva or Shiv as per the English Conventions.

Dont use any quotes in the the result , example if name is O'Donnell then remove the quotes.

If a Series is seen example Anand Ashram Series from Pune or Kashmir Series of Text and Studies from Srinagar
then add it also - including the Series nummber - after Author and hyphen. 

But use Acronyms or short forms so AAS or KSTS but KVM for Kavyamala.

If no Series is there then do same for Publisher. If No Publisher then Press but with acronyms 
So Nirnaya Sagar Press is NSP, Naval Kishore Press is NKP, Motilal Banarsidas is MLBD.

Output generated shount not exceed ${SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT_CHAR_LIMIT} characters including spaces

If no author, title, publisher or series is found then return the First Prominent Line written
`

/**
 * Sleep for a specified number of milliseconds
 * @param ms - milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

export const AI_ENDPOINT =
  `${process.env.AI_BASE_URL}${process.env.AI_API_VERSION}${process.env.AI_MODEL}${process.env.AI_METHOD}`;


export const AI_MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 8192);

export const INLINE_MAX_FILE_SIZE_MB = Number(process.env.AI_INLINE_MAX_MB || 8); // Safer inline cap; prefer Files API beyond this



// Allow overrides from environment
export const AI_BATCH_SIZE = Number(process.env.AI_BATCH_SIZE || AI_RENAMING_WORKFLOW_CONFIG.batchSize);
export const AI_DELAY_BETWEEN_CALLS_MS = Number(process.env.AI_DELAY_BETWEEN_CALLS_MS || AI_RENAMING_WORKFLOW_CONFIG.delayBetweenCallsMs);
export const AI_DELAY_BETWEEN_BATCHES_MS = Number(process.env.AI_DELAY_BETWEEN_BATCHES_MS || AI_RENAMING_WORKFLOW_CONFIG.delayBetweenBatchesMs);
export const PDF_VALIDATE_TIMEOUT_MS = Number(process.env.PDF_VALIDATE_TIMEOUT_MS);
