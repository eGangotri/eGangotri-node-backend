import { AI_ENDPOINT, AI_MAX_OUTPUT_TOKENS, GOOGLE_AI_API_KEY, INLINE_MAX_FILE_SIZE_MB, PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT, sleep } from "./constants";
import { BatchPair, PdfPair } from "./types";
import * as fs from 'fs';
import axios from 'axios';
import { GDRIVE_CP_EXTRACTED_METADATA_RES } from "../../../routes/utils";
import { limitCountAndSanitizeFileNameWithoutExt } from "../../../services/fileUtilsService";
import path from "path";
import { CUSTOM_METADATA_EXTRACTION_PROMPT } from "../../../routes/launchAI.route";


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

    return cleanName;
}

export function convertLocalFileToBasicEncodedString(filePath: string): string {
    // Read the PDF file as a buffer and check its size
    const fileAsBuffer = fs.readFileSync(filePath);
    const fileSizeMB = fileAsBuffer.length / (1024 * 1024);

    if (fileSizeMB > INLINE_MAX_FILE_SIZE_MB) {
        console.warn(`WARNING: File size (${fileSizeMB.toFixed(2)}MB) exceeds inline limit of ${INLINE_MAX_FILE_SIZE_MB}MB. Request may be rejected by the API.`);
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
    retryCount: number = 0,
    initialDelay: number = 1000): Promise<{ extractedMetadata: string, error: string }> => {
    console.log(`processLocalFileForAIRenaming ${filePath}...`);
    const base64EncodedFile = convertLocalFileToBasicEncodedString(filePath);
    const _result = await processFileForAIRenaming(base64EncodedFile, mimeType, CUSTOM_METADATA_EXTRACTION_PROMPT, retryCount, initialDelay);
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
        console.log(`processFileForAIRenaming:AI_ENDPOINT to ${AI_ENDPOINT} ...`);
        const response = await axios.post(AI_ENDPOINT, requestPayload, {
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_AI_API_KEY
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        // Extract the generated text from the Google API response format (Gemini 1.5/2.0/2.5/3.0 compatible)
        const { text, finishReason } = extractTextFromCandidates(response.data);
        const usage = response.data?.usageMetadata || {};
        const promptTokenCount = usage?.promptTokenCount;
        const totalTokenCount = usage?.totalTokenCount;

        let extractedMetadata: string;
        if (typeof text === 'string' && text.trim().length > 0) {
            extractedMetadata = limitCountAndSanitizeFileNameWithoutExt(text, PDF_METADATA_EXTRACTION_PROMPT_CHAR_LIMIT);
        } else {
            // If no text, include diagnostics: finishReason, configured maxOutputTokens, and usage metadata
            const diagnostic = finishReason ? `No text returned. finishReason=${finishReason}` : 'No text returned.';
            const usageInfo = `requestedMaxOutputTokens=${AI_MAX_OUTPUT_TOKENS}` +
                (typeof promptTokenCount === 'number' ? `, promptTokenCount=${promptTokenCount}` : '') +
                (typeof totalTokenCount === 'number' ? `, totalTokenCount=${totalTokenCount}` : '');
            console.warn(`Gemini response had no textual parts. ${diagnostic}. ${usageInfo}`);
            extractedMetadata = '';
        }
        console.log(`extractedMetadata(${GDRIVE_CP_EXTRACTED_METADATA_RES.processedCount}/${GDRIVE_CP_EXTRACTED_METADATA_RES.totalCount}): ${extractedMetadata}`);
        return {
            extractedMetadata,
            error: null
        };
    }
    catch (error) {
        console.error('processFileForAIRenaming: Full error data:', JSON.stringify((error as any)?.response?.data, null, 2));
        // Handle specific error types with more informative messages
        let errorMessage = '';
        console.error(`try/catch: ${error?.message}  ${error?.response?.status}`);
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
                // Rate limit (429) or Service Unavailable (503) handling.
                // Strategy: if the server asks us to wait more than AI_SKIP_THRESHOLD_MS (default 30s),
                // SKIP this file immediately (return a RATE_LIMITED marker) so the rest of the
                // pipeline can continue without a long stall. The caller (processAllBatches) will
                // collect all RATE_LIMITED files and retry them together at the end.
                const AI_SKIP_THRESHOLD_MS = Number(process.env.AI_SKIP_THRESHOLD_MS || 30_000);

                const retryAfterHeader = (error.response?.headers?.['retry-after'] || error.response?.headers?.['Retry-After']) as string | undefined;
                let serverDelayMs = 0;
                if (retryAfterHeader) {
                    const retrySec = parseInt(retryAfterHeader, 10);
                    if (!Number.isNaN(retrySec) && retrySec > 0) {
                        serverDelayMs = retrySec * 1000;
                        console.warn(`[Retry-After] Google AI returned Retry-After: ${retrySec}s (${(retrySec / 60).toFixed(1)} min).`);
                    }
                }

                // Exponential backoff for the short-wait path
                const baseDelay = initialDelay * Math.pow(2, retryCount);
                const jitter = Math.floor(Math.random() * baseDelay);
                const candidateDelayMs = Math.max(serverDelayMs, jitter);

                if (candidateDelayMs > AI_SKIP_THRESHOLD_MS) {
                    // Delay is too long — skip this file now and let the caller retry later.
                    const waitSec = Math.ceil(candidateDelayMs / 1000);
                    console.warn(`[Rate Limit] Delay (${waitSec}s) exceeds skip threshold (${AI_SKIP_THRESHOLD_MS / 1000}s). Skipping file — will retry after remaining files finish.`);
                    return {
                        extractedMetadata: `RATE_LIMITED:${waitSec}`,
                        error: `Rate limited — deferred retry needed (wait ${waitSec}s). Status: ${statusCode}`
                    };
                }

                // Short wait — inline retry as before
                const maxRetries = Number(process.env.AI_MAX_RETRIES || 5);
                if (retryCount < maxRetries) {
                    const errorType = statusCode === 429 ? 'Rate limit exceeded (429)' : 'Service Unavailable (503)';
                    console.warn(`${errorType}. Retrying inline in ${(candidateDelayMs / 1000).toFixed(2)}s... (Attempt ${retryCount + 1}/${maxRetries})`);
                    await sleep(candidateDelayMs);
                    return processFileForAIRenaming(base64EncodedFile, mimeType, prompt, retryCount + 1, initialDelay);
                } else {
                    const errorType = statusCode === 429 ? 'Rate limit exceeded' : 'Service Unavailable';
                    errorMessage = `${errorType}: Tried ${maxRetries} times. Status: ${statusCode}`;
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