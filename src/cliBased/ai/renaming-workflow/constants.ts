import * as dotenv from 'dotenv';
import { AI_RENAMING_WORKFLOW_CONFIG } from './types';

// Load environment variables
dotenv.config();

export const PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT = 170;
// Google AI Studio prompt for metadata extraction
export const PDF_METADATA_EXTRACTION_PROMPT = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other Indian languages including Tibetan that use Brahmi based scripts and sometimes Urdu.

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
     D. "Pecha" For Tibetan texts in Pecha Style the traditional Tibetan loose-leaf books such as the kangyur, tengyur, and sadhanas.
   - If Printed Book:
     A. Check if it is a "Journal" (Look for Vol, Issue, No, Month, or multiple articles).
     B. Check if it is "Pothi" format (Horizontal loose-leaf). doesnt apply to Tibetan Pechas
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
   - If it is a Tibetan Pecha, add "Pecha".
   - If it is a printed Lithograph, add "Lithograph".
   - If it is a Periodical/Magazine, add "Journal".
   - If visual analysis found art, add "Illustrated".
   - Manuscript overrides Pothi so if Manuscript is identified Pothi should not be used.
   - Pothi should not be used for Tibetan Texts only Pecha if it is a Pecha
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
   - No quotes single or double or backticks, no colons.
   - If words are conjoined (Shishupalavadha), separate them (Shishupala Vadha).But do not violate convention. So Ashtadhyayi stays not Astha Ashyayi.
   - Ignore pdf-header/footers.
   - If publisher has address (Penguin India), drop the country/city part from the name.

`;

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
