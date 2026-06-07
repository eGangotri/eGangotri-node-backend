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

const parseDurationToMs = (duration: any): number => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration * 1000;
    const match = `${duration}`.match(/^(\d+(?:\.\d+)?)s$/);
    return match ? Math.ceil(Number(match[1]) * 1000) : 0;
}

const getGoogleRetryDelayMs = (responseData: any): number => {
    const details = responseData?.error?.details;
    if (!Array.isArray(details)) return 0;
    const retryInfo = details.find((detail: any) => `${detail?.["@type"] || ""}`.includes("RetryInfo"));
    return parseDurationToMs(retryInfo?.retryDelay);
}

const getGoogleQuotaViolations = (responseData: any): string[] => {
    const details = responseData?.error?.details;
    if (!Array.isArray(details)) return [];
    const quotaFailure = details.find((detail: any) => `${detail?.["@type"] || ""}`.includes("QuotaFailure"));
    const violations = quotaFailure?.violations;
    if (!Array.isArray(violations)) return [];
    return violations.map((violation: any) => {
        const subject = violation?.subject ? `subject=${violation.subject}` : "";
        const description = violation?.description ? `description=${violation.description}` : "";
        return [subject, description].filter(Boolean).join(", ");
    }).filter(Boolean);
}

const classifyGoogleRateLimit = (responseData: any, retryDelayMs: number) => {
    const errorPayloadText = JSON.stringify(responseData || {});
    const message = `${responseData?.error?.message || ""} ${errorPayloadText}`.toLowerCase();
    let classification = "UNKNOWN_RATE_LIMIT";
    let likelyReset = retryDelayMs > 0 ? `Google requested retry after ${Math.ceil(retryDelayMs / 1000)} seconds.` : "No explicit reset time returned by Google.";
    let recommendedAction = retryDelayMs > 0 ? "Wait for the returned retry delay before retrying." : "Wait 5-30 minutes, then retry. Check Google AI quota dashboard if it persists.";

    if (message.includes("per day") || message.includes("requests per day") || message.includes("daily") || message.includes("generate_content_free_tier_requests")) {
        classification = "LIKELY_DAILY_QUOTA_24H";
        likelyReset = retryDelayMs > 0 ? likelyReset : "Likely daily/free-tier quota. It may reset in the next daily quota window, up to 24 hours.";
        recommendedAction = "Wait for daily quota reset, enable billing/increase quota, or switch API key/project/model.";
    } else if (message.includes("per minute") || message.includes("requests per minute") || message.includes("tokens per minute") || message.includes("generate_content_requests_per_minute") || message.includes("generate_content_tokens_per_minute")) {
        classification = "LIKELY_PER_MINUTE_QUOTA";
        likelyReset = retryDelayMs > 0 ? likelyReset : "Likely per-minute quota. Usually recovers gradually within 60-120 seconds.";
        recommendedAction = "Slow down calls, reduce PDF size/tokens, and retry after 1-2 minutes.";
    } else if (message.includes("per hour") || message.includes("hourly")) {
        classification = "LIKELY_HOURLY_QUOTA";
        likelyReset = retryDelayMs > 0 ? likelyReset : "Likely hourly quota. Retry later in the hourly quota window.";
        recommendedAction = "Wait 30-60 minutes or increase quota.";
    } else if (message.includes("token")) {
        classification = "LIKELY_TOKEN_QUOTA";
        likelyReset = retryDelayMs > 0 ? likelyReset : "Likely token quota. Reset depends on whether Google reports per-minute or per-day token quota.";
        recommendedAction = "Use smaller/reduced PDFs, lower prompt size, lower output tokens, or wait for quota reset.";
    } else if (retryDelayMs >= 12 * 60 * 60 * 1000) {
        classification = "LIKELY_LONG_DAILY_COOLDOWN";
        recommendedAction = "Treat as daily quota exhaustion. Retry after the requested cooldown.";
    } else if (retryDelayMs >= 60 * 1000) {
        classification = "EXPLICIT_COOLDOWN";
        recommendedAction = "Retry after the requested cooldown.";
    }

    return { classification, likelyReset, recommendedAction };
}

const buildGoogleRateLimitDiagnostics = (statusCode: number, responseData: any, retryAfterHeader: string | undefined) => {
    const retryAfterMs = retryAfterHeader && !Number.isNaN(parseInt(retryAfterHeader, 10)) ? parseInt(retryAfterHeader, 10) * 1000 : 0;
    const retryInfoMs = getGoogleRetryDelayMs(responseData);
    const retryDelayMs = Math.max(retryAfterMs, retryInfoMs);
    const quotaViolations = getGoogleQuotaViolations(responseData);
    const classification = classifyGoogleRateLimit(responseData, retryDelayMs);
    const googleStatus = responseData?.error?.status || "";
    const googleMessage = responseData?.error?.message || "";

    return {
        statusCode,
        googleStatus,
        googleMessage,
        retryAfterHeader: retryAfterHeader || "",
        retryInfoDelaySeconds: retryInfoMs ? Math.ceil(retryInfoMs / 1000) : 0,
        effectiveRetryDelaySeconds: retryDelayMs ? Math.ceil(retryDelayMs / 1000) : 0,
        quotaViolations,
        ...classification,
    };
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
        const responseData = (error as any)?.response?.data;
        console.error(`processFileForAIRenaming: Full error data: ${JSON.stringify(responseData || {}, null, 2)}`);
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
                const diagnostics = buildGoogleRateLimitDiagnostics(statusCode, responseData, retryAfterHeader);
                let serverDelayMs = diagnostics.effectiveRetryDelaySeconds * 1000;
                console.warn(`[Google AI Rate Limit Diagnostics] ${JSON.stringify(diagnostics, null, 2)}`);
                if (diagnostics.effectiveRetryDelaySeconds > 0) {
                    console.warn(`[Google AI Rate Limit] ${diagnostics.classification}. Retry after ${diagnostics.effectiveRetryDelaySeconds}s. ${diagnostics.recommendedAction}`);
                } else {
                    console.warn(`[Google AI Rate Limit] ${diagnostics.classification}. ${diagnostics.likelyReset} ${diagnostics.recommendedAction}`);
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
                        error: `Rate limited — deferred retry needed (wait ${waitSec}s). Status: ${statusCode}. Classification: ${diagnostics.classification}. ${diagnostics.recommendedAction}`
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
                    errorMessage = `${errorType}: Tried ${maxRetries} times. Status: ${statusCode}. Classification: ${diagnostics.classification}. Likely reset: ${diagnostics.likelyReset}. Recommendation: ${diagnostics.recommendedAction}`;
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