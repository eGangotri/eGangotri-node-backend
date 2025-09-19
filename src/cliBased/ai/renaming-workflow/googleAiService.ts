import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

// Google AI Studio prompt for metadata extraction
const METADATA_EXTRACTION_PROMPT = `The exercise below is to save the pdf with recognizable metadata.

Print these details in Title Case

Title Author Language Year Publisher in One Line in English only.

If any entry is not visible then just leave it blank if author/title is not known then instead print Unknown.

Make sure to only write the metadata not things like Title: etc.

If there is no publisher then make the author the last entry.

The last non-blank entry should be preceded by a hyphen which can only be publisher or author

If there is a publisher and there is a title , the title and author should be separated by " by ".

Dont use any quotes in the the result , example if name is O'Donnell then remove the quotes.
if this is a magazine then Issue No Volume No year month , ciruclation cycle example bimonthly, trimonthly should be also shown and the word Magazine or Journal should display before the year
No diacritics

If the words are in Sanskrit and they are conjoined like Shishupalavadha due to the rules of Sanskrit compunding called Samasa separate them so that they are more online search friendly to something like Shishupala Vadha which will be easier for a modern reader to grasp.

If you feel any pages in the front or back are missing, then you can add the text Missing Pages before the year to let the reader know he is in for some minor inconvenience

ignore comas
If the publisher has address info such Penguin India drop the portion that will describe the country
ignore the pdf-header and pdf-footers which if provided is merely ascribing the custodians or scanning agencies which is irrelevant to our metadata extraction of the book`;

export interface MetadataResult {
  originalFilePath: string;
  fileName: string;
  extractedMetadata: string;
  error?: string;
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process PDF with Google AI Studio using direct PDF upload with retry logic
 * 
 * @param pdfFilePath - The original PDF file path
 * @param retryCount - Number of retries attempted (internal parameter)
 * @param initialDelay - Initial delay for exponential backoff in ms (internal parameter)
 * @returns Promise<MetadataResult> - The processed metadata result
 */
export async function processWithGoogleAI(
  pdfFilePath: string, 
  retryCount: number = 0, 
  initialDelay: number = 1000
): Promise<MetadataResult> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key not found in environment variables. Please add GOOGLE_AI_API_KEY to your .env file.');
    }
    
    // Read the PDF file as a buffer and check its size
    const pdfBuffer = fs.readFileSync(pdfFilePath);
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    const MAX_PDF_SIZE_MB = 10; // Gemini typically has ~10MB limit for PDFs
    
    if (fileSizeMB > MAX_PDF_SIZE_MB) {
      console.warn(`WARNING: PDF file size (${fileSizeMB.toFixed(2)}MB) exceeds recommended limit of ${MAX_PDF_SIZE_MB}MB. API may reject the request.`);
    }
    
    // Convert to base64
    const base64EncodedPdf = pdfBuffer.toString('base64');
    
    // Google AI Studio endpoint URL
    const aiEndpoint = process.env.AI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    
    console.log(`Sending PDF ${path.basename(pdfFilePath)} to Google AI service...`);
    
    // Add a small random delay before API calls to help avoid rate limit issues when processing in batches
    const randomDelay = Math.floor(Math.random() * 500);
    await sleep(randomDelay);
    
    // Prepare request payload in the format Google API expects
    const requestPayload = {
      contents: [{
        parts: [
          { text: METADATA_EXTRACTION_PROMPT },
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: base64EncodedPdf
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 300
      }
    };
    
    // Make the API request to Google AI Studio
    const response = await axios.post(aiEndpoint, requestPayload, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    // Extract the generated text from the Google API response format
    const extractedMetadata = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 
                             JSON.stringify(response.data);
    
    return {
      originalFilePath: pdfFilePath,
      fileName: path.basename(pdfFilePath),
      extractedMetadata: extractedMetadata.trim()
    };
    
  } catch (error) {
    // Handle specific error types with more informative messages
    let errorMessage = '';
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = `Authentication failed: Check that your Google API key is valid and has access to the Gemini API. Status code: ${statusCode}`;
        console.error(errorMessage);
      } else if (statusCode === 400) {
        errorMessage = `Bad request: The PDF may be too large or in an unsupported format. Status code: ${statusCode}`;
        console.error(errorMessage);
      } else if (statusCode === 429) {
        // Rate limit handling with exponential backoff
        const maxRetries = 3;
        if (retryCount < maxRetries) {
          const delayMs = initialDelay * Math.pow(2, retryCount); // Exponential backoff
          console.warn(`Rate limit exceeded (429). Retrying in ${delayMs/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          await sleep(delayMs);
          
          // Retry the request with increased retry count and delay
          return processWithGoogleAI(pdfFilePath, retryCount + 1, initialDelay);
        } else {
          errorMessage = `Rate limit exceeded: Too many requests to the API. Tried ${maxRetries} times with backoff. Status code: ${statusCode}`;
          console.error(errorMessage);
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection timeout: The request took too long to complete';
        console.error(errorMessage);
      } else {
        errorMessage = `API error: ${error.message} (Status code: ${statusCode || 'unknown'})`;
        console.error(`Error processing PDF with Google AI: ${pdfFilePath}`, error);
      }
    } else {
      errorMessage = `Error processing PDF: ${error.message || 'Unknown error occurred'}`;
      console.error(`Error processing PDF with Google AI: ${pdfFilePath}`, error);
    }
    
    // Fall back to using filename as a last resort
    try {
      // Extract potential metadata from filename
      const fileName = path.basename(pdfFilePath, '.pdf');
      return {
        originalFilePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        extractedMetadata: fileName,
        error: `${errorMessage}. Using filename instead.`
      };
    } catch (fallbackError) {
      // If even the fallback fails
      return {
        originalFilePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        extractedMetadata: '',
        error: errorMessage || 'Unknown error occurred'
      };
    }
  }
}
