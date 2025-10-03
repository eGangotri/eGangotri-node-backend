import { AI_ENDPOINT, AI_MAX_OUTPUT_TOKENS, GOOGLE_AI_API_KEY, INLINE_MAX_FILE_SIZE_MB, PDF_METADATA_EXTRACTION_PROMPT, sleep } from "./constants";
import { BatchPair, PdfPair } from "./types";
import * as fs from 'fs';
import axios from 'axios';


export function buildPairedPdfs(allPdfs: string[], allReducedPdfs: string[]): PdfPair[] {
    if (allPdfs.length !== allReducedPdfs.length) {
        throw new Error(`Input arrays must be the same length. allPdfs=${allPdfs.length}, allReducedPdfs=${allReducedPdfs.length}`);
    }
    return allPdfs.map((pdf, index) => ({
        index,
        pdf,
        reducedPdf: allReducedPdfs[index],
    }));
}

export function buildPairedBatches(batches: string[][], batchesReduced: string[][]): BatchPair[] {
    if (batches.length !== batchesReduced.length) {
        return []
    }
    return batches.map((pdfs, index) => ({
        index,
        pdfs,
        reducedPdfs: batchesReduced[index],
    }));
}


/**
 * Clean and format the metadata string for use as a filename
 * @param metadata - The metadata string from Google AI
 * @returns Cleaned and formatted string
 */
export function formatFilename(metadata: string): string {
    // Remove any invalid filename characters
    let cleanName = metadata
        .replace(/[\\/:*?"<>|]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
        .trim();                        // Remove leading/trailing spaces

    // Ensure the filename isn't too long (Windows has a 260 character path limit)
    if (cleanName.length > 200) {
        cleanName = cleanName.substring(0, 197) + '...';
    }

    return cleanName + '.pdf';
}

export function convertLocalFileToBasicEncodedString(filePath: string): string {
    // Read the PDF file as a buffer and check its size
    const fileAsBuffer = fs.readFileSync(filePath);
    const fileSizeMB = fileAsBuffer.length / (1024 * 1024);

    if (fileSizeMB > INLINE_MAX_FILE_SIZE_MB) {
        console.warn(`WARNING: Dile size (${fileSizeMB.toFixed(2)}MB) exceeds inline limit of ${INLINE_MAX_FILE_SIZE_MB}MB. Request may be rejected by the API.`);
    }

    // Convert to base64
    const base64EncodedFile = fileAsBuffer.toString('base64');

    return base64EncodedFile;
}

/**
 * Encode an in-memory payload (ArrayBuffer/Uint8Array/Buffer) to base64 with inline size check.
 * This avoids any local file IO and can be used with bytes fetched from Google Drive (alt: 'media').
 */
export function convertBufferToBasicEncodedString(
    data: ArrayBuffer | Uint8Array | Buffer,
    label: string = 'file'
): string {
    const buf: Buffer = Buffer.isBuffer(data)
        ? data as Buffer
        : (data instanceof Uint8Array
            ? Buffer.from(data)
            : Buffer.from(data as ArrayBuffer));

    const fileSizeMB = buf.length / (1024 * 1024);
    if (fileSizeMB > INLINE_MAX_FILE_SIZE_MB) {
        console.warn(`WARNING: ${label} size (${fileSizeMB.toFixed(2)}MB) exceeds inline limit of ${INLINE_MAX_FILE_SIZE_MB}MB. Request may be rejected by the API.`);
    }
    return buf.toString('base64');
}

export const processLocalFileForAIRenaming = async (filePath: string, mimeType: string,
    prompt: string,
    retryCount: number = 0,
    initialDelay: number = 1000): Promise<{ extractedMetadata: string, error: string }> => {
    console.log(`processLocalFileForAIRenaming ${filePath}...`);
    const base64EncodedFile = convertLocalFileToBasicEncodedString(filePath);
    const _result = await processFileForAIRenaming(base64EncodedFile, mimeType, prompt, retryCount, initialDelay);
    if (_result.error) {
        return { extractedMetadata: '', error: _result.error + ': ' + filePath };
    }
    return _result;
}

export const processFileForAIRenaming = async (base64EncodedFile: string,
     mimeType: string,
      prompt: string,
    retryCount: number = 0,
    initialDelay: number = 1000): Promise<{ extractedMetadata: string, error: string }> => {

    // Always use inline_data (Files API path removed by request)
    const requestPayload = generatePayload(base64EncodedFile, mimeType, prompt);

    try {
        // Make the API request to Google AI Studio
        const response = await axios.post(AI_ENDPOINT, requestPayload, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_AI_API_KEY
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        // Extract the generated text from the Google API response format (Gemini 1.5/2.0/2.5 compatible)
        const { text, finishReason } = extractTextFromCandidates(response.data);
        const usage = response.data?.usageMetadata || {};
        const promptTokenCount = usage?.promptTokenCount;
        const totalTokenCount = usage?.totalTokenCount;

        let extractedMetadata: string;
        if (typeof text === 'string' && text.trim().length > 0) {
            extractedMetadata = text.trim();
        } else {
            // If no text, include diagnostics: finishReason, configured maxOutputTokens, and usage metadata
            const diagnostic = finishReason ? `No text returned. finishReason=${finishReason}` : 'No text returned.';
            const usageInfo = `requestedMaxOutputTokens=${AI_MAX_OUTPUT_TOKENS}` +
                (typeof promptTokenCount === 'number' ? `, promptTokenCount=${promptTokenCount}` : '') +
                (typeof totalTokenCount === 'number' ? `, totalTokenCount=${totalTokenCount}` : '');
            console.warn(`Gemini response had no textual parts. ${diagnostic}. ${usageInfo}`);
            extractedMetadata = '';
        }
        console.log(`extractedMetadata: ${extractedMetadata}`);
        return {
            extractedMetadata,
            error: null
        };
    }
    catch (error) {
        console.error('Full error data:', JSON.stringify((error as any)?.response?.data, null, 2));
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
                    return processFileForAIRenaming(base64EncodedFile, mimeType, prompt, retryCount + 1, initialDelay);
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
                console.error(`Error processing PDF with Google AI:`, error);
            }
        } else {
            errorMessage = `Error processing PDF: ${error.message || 'Unknown error occurred'}`;
            console.error(`Error processing PDF with Google AI:`, error);
        }

        return {
            extractedMetadata: 'NIL',
            error: errorMessage
        }
    }

}

/**
 * Extract concatenated text from a Gemini response in a robust way
 */
function extractTextFromCandidates(data: any): { text: string | undefined; finishReason?: string } {
    try {
        const candidates = data?.candidates;
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return { text: undefined, finishReason: undefined };
        }
        const first = candidates[0];
        const finishReason = first?.finishReason;
        const parts = first?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
            const texts: string[] = [];
            for (const p of parts) {
                if (typeof p?.text === 'string' && p.text.trim().length > 0) {
                    texts.push(p.text);
                }
            }
            if (texts.length > 0) {
                return { text: texts.join('\n').trim(), finishReason };
            }
        }
        return { text: undefined, finishReason };
    } catch {
        return { text: undefined };
    }
}

const generatePayload = (base64EncodedPdf: string, mimeType: string, prompt: string) => {
    return {
        contents: [{
            role: 'user',
            parts: [
                { text: prompt },
                {
                    inline_data: {
                        mime_type: mimeType,
                        data: base64EncodedPdf
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: AI_MAX_OUTPUT_TOKENS
        }
    };
}

//processLocalFileForAIRenaming("C:\\tmp\\BN.pdf", "application/pdf", 0, 1000);