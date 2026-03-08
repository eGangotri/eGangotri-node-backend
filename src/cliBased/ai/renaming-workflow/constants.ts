import * as dotenv from 'dotenv';
import { AI_RENAMING_WORKFLOW_CONFIG } from './types';

// Load environment variables
dotenv.config();

export const PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT = 170;
// Google AI Studio prompt for metadata extraction
export const PDF_METADATA_EXTRACTION_PROMPT = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts and sometimes Urdu.

The output should be only ASCII letters (A-Z, a-z) and numbers (0-9) without exception. 
No Comma, colon, slashes , diacritics etc should be used.

Conventional English spellings of words in Sanskrit and other languages should be used.
Dont use Jy for ञ use Gy instead.

--- VISUAL ANALYSIS INSTRUCTIONS ---
1. MATERIAL & FORMAT ANALYSIS:
   - Analyze if the image is a Standard Print Book, Lithograph, or Manuscript.
   - If Manuscript, identify the material:
     A. "Palm Leaf Manuscript" (Long, narrow strips, horizontal grain, string holes).
     B. "Birch Bark Manuscript" (Flaky, layered bark texture, brownish).
     C. "Paper Manuscript" (Handwritten on standard paper).
   - If Printed Book:
     A. Check if it is a "Journal" (Look for Vol, Issue, No, Month, or multiple articles).
     B. Check if it is "Pothi" format (Horizontal loose-leaf).
     C. Check if it is "Lithograph" (Early printing resembling handwriting).

2. ILLUSTRATION ANALYSIS:
   - If the document contains even a single painting, miniature, diagram, or distinct geometric Yantra, add "Illustrated" to the Subject field.

3. SCRIPT ANALYSIS:
   - Identify the primary script.
   - If a secondary script is present and constitutes more than 5% of the text (e.g., distinct Tika in a different script, or alternating verses), note both scripts.

------------------------------------

Print the following details in Title Case:

Title SubTitle Commentary Commentator Author Editor Translator Language Subject Publication City Year - Publisher in One Line in English only. 

The Hyphen will separate the main text from the Publisher.

If any entry is not visible then just leave it blank. 
If author/title is not known then instead print Unknown.

--- FIELD FILLING RULES ---

1. SUBJECT FIELD:
   - Include the broad topic (e.g. Vedanta).
   - MANDATORY: If it is a manuscript, include the material type identified above (e.g., "Palm Leaf Manuscript", "Birch Bark Manuscript", "Paper Manuscript").
   - If it is a printed Pothi, add "Pothi".
   - If it is a printed Lithograph, add "Lithograph".
   - If it is a Periodical/Magazine, add "Journal".
   - If visual analysis found art, add "Illustrated".
   - Manuscript overrides Pothi so if Manuscript is identified Pothi should not be used
   Example Subject Output: "Vedanta Palm Leaf Manuscript Illustrated" or "Ayurveda Journal"

2. LANGUAGE FIELD:
   - If Language is Sanskrit but script is not Devanagari, add the Script name (e.g. "Sanskrit in Telugu Script").
   - If MULTIPLE scripts are used (>5% mix), mention both (e.g., "Sanskrit in Devanagari and Sharada Scripts").

3. TITLE/AUTHOR/PUBLISHER LOGIC:
   - SubTitle is optional only if exists.
   - Commentary/Commentator (Tika/Tikakar) is optional. If exists, include it.
   - Editor/Translator: If different from Author, include them.
   - If book is completely in English, no need to mention language.

   - HYPHEN RULE:
     - The Hyphen is strictly for the Publisher or Series.
     - If there is a Publisher, make it the last entry.
     - If there is NO Publisher, make the Author the last entry preceded by hyphen.
     - If NO Publisher and NO Author (common in manuscripts), use "Unknown" as the last entry preceded by hyphen.
     
   Format Examples:
   - Print: Title Language Year - Publisher
   - Manuscript: Title Language Subject Year - Author
   - No Info: Title Language Subject Year - Unknown

   - If there is a publisher AND title AND author, the title and author should be separated by " By ".

4. MISSING PAGES:
   - If book seems to miss pages in the beginning (e.g. starts abruptly) or end, add "Missing Pages" before the year or city.

5. CLEANUP:
   - Output should not exceed ${PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT} characters.
   - Transliterate Hindi/Sanskrit titles to English (e.g., Kalidas Ka Adhunik...). Do not translate meanings.
   - Use conventional English spellings (Ram, Shiva).
   - If Institutional publisher has English and Indian names, use English.
   - No quotes, no colons.
   - If words are conjoined (Shishupalavadha), separate them (Shishupala Vadha).But do not violate convention. So Ashtadhyayi stays not Astha Ashyayi.
   - Ignore pdf-header/footers.
   - If publisher has address (Penguin India), drop the country/city part from the name.

`;

export const PDF_METADATA_EXTRACTION_PROMPT_OLD2 = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts and sometimes Urdu.

The output should be only ASCII letters (A-Z, a-z) and numbers (0-9) without exception. 
No Comma, colon, slashes , diacritics etc should be used.

Conventional English spellings of words in Sanskrit and other languages should be used.
Dont use Jy for ञ use Gy instead.

--- VISUAL ANALYSIS INSTRUCTIONS ---
1. First, visually analyze the image to determine if it is:
   - A Standard Printed Book
   - A Handwritten Manuscript (look for uneven strokes, scribal handwriting, lack of fonts)
   - A Lithograph (early printing looking like handwriting)
   - A Pothi (Horizontal loose-leaf format)

2. If it is a Handwritten Manuscript:
   - Add the word "Manuscript" to the Subject field.
   - Look for the Title and Author in the first lines (Incipit) or the last lines (Colophon).
   
3. If it is a Printed Book but in Pothi format:
   - Add "Pothi" to the Subject field.

4. If book appears to be Lithograph:
   - Add "Lithograph" to the Subject field.
  
------------------------------------

Print the following details in Title Case:

Title SubTitle Commentary Commentator Author Editor Translator Language Subject Publication City Year - Publisher in One Line in English only. 

The Hyphen will separate the main text from the Publisher.

If any entry is not visible then just leave it blank. 
If author/title is not known then instead print Unknown.

If the Subject can be broadly guessed like Vedanta, Aesthetics etc it can be included.
IMPORTANT: If the image is handwritten, "Manuscript" MUST be included in the Subject words.

Make sure to only write the metadata not things like Title: etc.

SubTitle is optional only if exists.
Commentary/Commentator also called Tika/Tikakar or Vyakhya/Vyakhyakar in Sanskrit is optional.
If exists then should be included.

Same for Editor Translator.

If book is completely in English then no need to mention language.

If there is no publisher then make the author the last entry preceeded by hyphen. 

So :
Title Language Year - Author (If print book with no publisher)

If there is a publisher then make the publisher the last entry.
If there is no publisher then replace it by something like Series.
Example Kavyamala Series, Choukhamba Sanskrit Series...

Only Author or Publisher or Series can be the last entry and should be preceeded by a hyphen.

Never make title year etc the last entry.

If there is a publisher and there is a title and author , the title and author should be separated by " By ".

If Language is Sanskrit but script is not Devanagari then try to add the Script as well (e.g. Sanskrit in Tamil Script).

If book seem to miss pages in the beginning or in the end add before the year or city or dash the text "Missing Pages". Remember that we will mostly supply the first 15 pages and last 7-10 pages so missing identifies missing from front (like book starting with a preface) or end (not having proper end pages)

If Multiple languages exist such as Sanskrit Original with Translation then add all languages.

If there is a Editor of the Text different from the Author add Editor info.

If Publisher is not available then treat the Press as Publisher.

Output generated should not exceed ${PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT} characters including spaces.

If the original title is in Hindi/Sanskrit, transliterate it to English (e.g., Kalidas Ka Adhunik...).
Dont translate title into English ever just transliteration.

If any Institutional publisher has two names give preference to the English in the output.

If there are multiple spellings possible in English, give preference to Conventional English spellings (Ram instead of Rama, Shiva instead of Siva).

Dont use any quotes in the result.
If this is a magazine then include Issue No., Volume No., year...

If the words are in Sanskrit and they are conjoined like Shishupalavadha separate them to Shishupala Vadha.

If the publisher has address info such Penguin India drop the portion that will describe the country.

ignore the pdf-header and pdf-footers.`;



export const PDF_METADATA_EXTRACTION_PROMPT_OLD = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts
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

export const SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT_CHAR_LIMIT = 50
export const SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT = `
This is an exercise to extract the title and author of the Cover Page of a book saved as a one page pdf/jpeg/png file.

If the Image is not a cover-page of book or manuscript but a stack of books then return NIL.

Output must be limited to ASCII letters (A-Z, a-z), spaces, and the hyphen (-). Do not use any other symbols or diacritics.

The output should be in Title Case.

The output should be in one line.

The output should be in the English script only.

The output should be in the format: Title - Author - Language - Series OR Publisher

Author also implies Editor or Translator or Commentator.
 
For Non-English language books the Title should capture the original Title in the English Script no translation

The Language or Script should be in 2 Alphabet ISO 639-1 format.

Conventional English spellings of words in Sanskrit and other languages should be used.

Example: Ram instead of Rama. Shiva instead of Siva or Shiv as per the English Conventions.

Dont use any quotes in the the result , example if name is O'Donnell then remove the quotes.

If a Series is seen example Anand Ashram Series from Pune or Kashmir Series of Text and Studies from Srinagar
then add it also - including the Series nummber - after Author and hyphen. 

If no author, title, publisher or series is found then return the First Prominent Line written

Output generated shount not exceed ${SIMPLE_TITLE_AUTHOR_GDRIVE_CP_RENAME_PROMPT_CHAR_LIMIT} characters including spaces

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
