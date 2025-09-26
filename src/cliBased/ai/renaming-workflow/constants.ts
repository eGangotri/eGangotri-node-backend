
// Google AI Studio prompt for metadata extraction
export  const METADATA_EXTRACTION_PROMPT = `The exercise below is to save a pdf with recognizable metadata mostly English, Sanskrit and other languages that use Brahmi based scripts
 and sometimes Urdu.

Print the followwing details in Title Case

Title Sub Title Author Language Subject Publication City Year - Publisher in One Line in English only. 

The Hyphen will separate the main text from the Publisher

optionally Editor and/or Translator.

If any entry is not visible then just leave it blank. 

if author/title is not known then instead print Unknown.

Make sure to only write the metadata not things like Title: etc.

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

Keep Count of generated text under 170 characters

If the original title in Hindi is liek this for example:

मेघदुत रामनाथ ऐण्ड सन्स

instead of transliterating to Ramanath aind sanz use the official English Ramanath and Sons

if any Institutional publisher has two names one in English and one in Sanskrit/Hindi etc like Oriental Research Institute and 'Prachya Vidya Shodha Kendra'
give preference to the English in the output.

The output should be created with a Modern English User in mind with spellings and conventions 
that modern users are familair with.

This inturn will also help in easier google-searches.

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
