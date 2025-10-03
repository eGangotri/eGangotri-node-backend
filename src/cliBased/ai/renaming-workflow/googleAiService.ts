import * as dotenv from 'dotenv';
import * as path from 'path';
import { MetadataResult } from './types';
import { processLocalFileForAIRenaming } from './utils';
import { AI_ENDPOINT, PDF_METADATA_EXTRACTION_PROMPT, sleep } from './constants';
import { PDF_MIME_TYPE } from '../../../cliBased/googleapi/_utils/constants';



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



export async function processWithGoogleAI(
  pdfFilePath: string
): Promise<MetadataResult> {
  try {

    console.log(`Sending PDF ${path.basename(pdfFilePath)} to Google AI service(${AI_ENDPOINT})...`);

    // Add a small random delay before API calls to help avoid rate limit issues when processing in batches
    const randomDelay = Math.floor(Math.random() * 500);
    await sleep(randomDelay);

    const {extractedMetadata, error} = await processLocalFileForAIRenaming(pdfFilePath, PDF_MIME_TYPE, PDF_METADATA_EXTRACTION_PROMPT);

    if (error || extractedMetadata === 'NIL') {
      return {
        originalFilePath: pdfFilePath,
        fileName: path.basename(pdfFilePath),
        extractedMetadata: extractedMetadata,
        error: error
      };
    }

    return {
      originalFilePath: pdfFilePath,
      fileName: path.basename(pdfFilePath),
      extractedMetadata: extractedMetadata,
    };

  } catch (error) {
    console.error('- Error processing PDF with Google AI: ', error);
    return {
      originalFilePath: pdfFilePath,
      fileName: path.basename(pdfFilePath),
      extractedMetadata: '',
      error: error
    };
  }

}
