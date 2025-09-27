import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { METADATA_EXTRACTION_PROMPT } from './constants';
import { MetadataResult } from './types';

// Load environment variables
dotenv.config();


/**
 * Sleep for a specified number of milliseconds
 * @param ms - milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Files API helpers removed as inline_data is the only supported path in this workflow

/**
 * Process PDF with Google AI Studio using direct PDF upload with retry logic
 * 
 * @param pdfFilePath - The original PDF file path
 * @param retryCount - Number of retries attempted (internal parameter)
 * @param initialDelay - Initial delay for exponential backoff in ms (internal parameter)
 * @returns Promise<MetadataResult> - The processed metadata result
  Make Sure:
Go to Google Cloud Console for AI Stuido
    Select your project
    Go to "APIs & Services" > "Library"
    Search for "Gemini API" or "Generative Language API"
    Click "Enable"

*/

const aiEndpoint = 
`${process.env.AI_BASE_URL}${process.env.AI_API_VERSION}${process.env.AI_MODEL}${process.env.AI_METHOD}`;

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
    const INLINE_MAX_PDF_SIZE_MB = Number(process.env.AI_INLINE_MAX_MB || 8); // Safer inline cap; prefer Files API beyond this

    if (fileSizeMB > INLINE_MAX_PDF_SIZE_MB) {
      console.warn(`WARNING: PDF file size (${fileSizeMB.toFixed(2)}MB) exceeds inline limit of ${INLINE_MAX_PDF_SIZE_MB}MB. Request may be rejected by the API.`);
    }

    // Convert to base64
    const base64EncodedPdf = pdfBuffer.toString('base64');

    // Google AI Studio endpoint URL

    if ("" === aiEndpoint) {
      const error = `Google AI endpoint not found in environment variables. 
      Please add AI_ENDPOINT_URI and AI_ENPOINT_MODEL to your .env file.`
      console.log(error)
      return {
        originalFilePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        extractedMetadata: '',
        error: error
      };
    }
    console.log(`Sending PDF ${path.basename(pdfFilePath)} to Google AI service(${aiEndpoint})...`);

    // Add a small random delay before API calls to help avoid rate limit issues when processing in batches
    const randomDelay = Math.floor(Math.random() * 500);
    await sleep(randomDelay);

    // Always use inline_data (Files API path removed by request)
    const requestPayload = {
      contents: [{
        role: 'user',
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
    console.error(`try/catch: ${error?.message}  ${error?.response?.status}`);
    console.error('Full error data:', JSON.stringify((error as any)?.response?.data, null, 2));
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;

      if (statusCode === 401 || statusCode === 403) {
        errorMessage = `Authentication failed: Check that your Google API key is valid and has access to the Gemini API. Status code: ${statusCode}`;
        console.error(errorMessage);
      } else if (statusCode === 400) {
        errorMessage = `Bad request: The PDF may be too large or in an unsupported format. Status code: ${statusCode}`;
        console.error(errorMessage);
        console.error('API 400 body:', JSON.stringify(error.response?.data, null, 2));
      } else if (statusCode === 429 || statusCode === 503) {
        // Rate limit (429) or Service Unavailable (503) handling with exponential backoff
        const maxRetries = Number(process.env.AI_MAX_RETRIES || 5);
        if (retryCount < maxRetries) {
          // Respect Retry-After header if present (seconds)
          const retryAfterHeader = (error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After']) as string | undefined;
          let serverDelayMs = 0;
          if (retryAfterHeader) {
            const retrySec = parseInt(retryAfterHeader, 10);
            if (!Number.isNaN(retrySec) && retrySec > 0) {
              serverDelayMs = retrySec * 1000;
            }
          }
          // Exponential backoff with full jitter
          const baseDelay = initialDelay * Math.pow(2, retryCount);
          const jitter = Math.floor(Math.random() * baseDelay);
          const delayMs = Math.max(serverDelayMs, jitter);
          
          const errorType = statusCode === 429 ? 'Rate limit exceeded (429)' : 'Service Unavailable (503)';
          console.warn(`${errorType}. Retrying in ${(delayMs / 1000).toFixed(2)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
          await sleep(delayMs);

          // Retry the request with increased retry count and delay
          return processWithGoogleAI(pdfFilePath, retryCount + 1, initialDelay);
        } else {
          const errorType = statusCode === 429 ? 'Rate limit exceeded' : 'Service Unavailable';
          errorMessage = `${errorType}: ${statusCode === 429 ? 'Too many requests to the API' : 'Google AI service is temporarily unavailable'}. Tried ${maxRetries} times with backoff. Status code: ${statusCode}`;
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
      console.log(`Error Using filename as fallback: ${fileName}`);
      return {
        originalFilePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        extractedMetadata: fileName,
        error: `${errorMessage}. Using filename instead.`
      };
    } catch (fallbackError) {
      console.error('Full error data:', JSON.stringify((fallbackError as any)?.response?.data, null, 2));
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
