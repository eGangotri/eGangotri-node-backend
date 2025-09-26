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

/**
 * Upload a PDF to Google Generative Language Files API.
 * Returns the file URI on success (e.g., files/abc123 or gs://bucket/object depending on API response).
 * If the upload fails, throws an error and the caller should fallback to inline mode.
 */
async function uploadPdfToFilesApi(pdfFilePath: string, apiKey: string): Promise<string> {
  // Use the upload endpoint with uploadType=multipart
  // Docs: https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart
  const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key=${apiKey}`;

  const boundary = `----WSBoundary${Date.now()}`;
  const fileBuffer = fs.readFileSync(pdfFilePath);
  const filename = path.basename(pdfFilePath);

  const jsonPart = Buffer.from(
    JSON.stringify({
      file: {
        display_name: filename,
        mime_type: 'application/pdf'
      }
    }),
    'utf-8'
  );

  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${jsonPart.toString()}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/pdf\r\n\r\n`,
    'utf-8'
  );
  const closing = Buffer.from(`\r\n--${boundary}--`, 'utf-8');
  const multipartBody = Buffer.concat([preamble, fileBuffer, closing]);

  try {
    console.log(`Files API: multipart upload -> ${url}`);
    const resp = await axios.post(url, multipartBody, {
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Response usually contains a file object with name/uri
    // Try common locations
    const fileName = resp.data?.file?.name || resp.data?.name || resp.data?.file?.uri || resp.data?.uri;
    if (!fileName) {
      throw new Error(`Files API upload succeeded but response lacked a file URI: ${JSON.stringify(resp.data)}`);
    }
    // Wait for file to become ACTIVE before using it
    await waitForFileActive(fileName as string, apiKey);
    return fileName as string;
  } catch (e: any) {
    // If multipart fails (commonly 400/404), fallback to raw media upload
    if (e?.response?.status && e.response.status >= 400 && e.response.status < 500) {
      console.warn(`Multipart upload failed with ${e.response.status}. Falling back to raw media upload.`);
      const rawUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${apiKey}`;
      console.log(`Files API: raw media upload -> ${rawUrl}`);
      const rawResp = await axios.post(rawUrl, fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          // X-Goog-Upload-File-Name is optional for simple media uploads
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      const fileName = rawResp.data?.file?.name || rawResp.data?.name || rawResp.data?.file?.uri || rawResp.data?.uri;
      if (!fileName) {
        throw new Error(`Raw Files API upload succeeded but response lacked a file URI: ${JSON.stringify(rawResp.data)}`);
      }
      await waitForFileActive(fileName as string, apiKey);
      return fileName as string;
    }
    throw e;
  }
}

/**
 * Poll the Files API until the file state is ACTIVE or timeout.
 */
async function waitForFileActive(fileNameOrUri: string, apiKey: string, options?: { maxWaitMs?: number; pollIntervalMs?: number }) {
  const maxWaitMs = options?.maxWaitMs ?? Number(process.env.AI_FILES_MAX_WAIT_MS || 30000);
  const pollIntervalMs = options?.pollIntervalMs ?? Number(process.env.AI_FILES_POLL_INTERVAL_MS || 1000);
  const start = Date.now();
  // fileName may come as 'files/abc123' or a full URI; the Files API expects 'v1beta/files/{name}'
  const name = fileNameOrUri.startsWith('files/') ? fileNameOrUri : `files/${fileNameOrUri}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`;
  while (Date.now() - start < maxWaitMs) {
    try {
      const resp = await axios.get(url);
      const state = resp.data?.state || resp.data?.file?.state;
      if (state === 'ACTIVE') {
        return;
      }
      // If PROCESSING or unknown, wait and poll again
    } catch (e) {
      // Ignore transient errors during poll and continue
    }
    await sleep(pollIntervalMs);
  }
  console.warn(`Files API: file ${name} did not reach ACTIVE within ${maxWaitMs}ms; proceeding anyway.`);
}

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
      console.warn(`WARNING: PDF file size (${fileSizeMB.toFixed(2)}MB) exceeds inline limit of ${INLINE_MAX_PDF_SIZE_MB}MB. Will attempt Files API upload.`);
    }

    // Convert to base64
    const base64EncodedPdf = pdfBuffer.toString('base64');

    // Google AI Studio endpoint URL
    const aiEndpoint = process.env.AI_ENDPOINT || "";

    if ("" === aiEndpoint) {
      const error = `Google AI endpoint not found in environment variables. 
      Please add AI_ENDPOINT to your .env file.`
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

    // Choose between Files API or inline_data based on size or env toggle
    const preferFilesApi = String(process.env.AI_USE_FILES_API || 'true').toLowerCase() === 'true';
    let requestPayload: any;
    let usedFilesApi = false;

    try {
      if (preferFilesApi || fileSizeMB > INLINE_MAX_PDF_SIZE_MB) {
        const fileUri = await uploadPdfToFilesApi(pdfFilePath, apiKey);
        usedFilesApi = true;
        requestPayload = {
          contents: [{
            role: 'user',
            parts: [
              { text: METADATA_EXTRACTION_PROMPT },
              {
                file_data: {
                  mime_type: 'application/pdf',
                  file_uri: fileUri
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
      } else {
        // Prepare request payload using inline_data for small PDFs
        requestPayload = {
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
      }
    } catch (uploadErr) {
      console.error('Files API upload failed, falling back to inline_data:', uploadErr);
      // Fallback to inline_data if upload failed
      requestPayload = {
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
    }

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
      } else if (statusCode === 429) {
        // Rate limit handling with exponential backoff
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
          console.warn(`Rate limit exceeded (429). Retrying in ${(delayMs / 1000).toFixed(2)} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
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
