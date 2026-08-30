const TRANSIENT_ERROR_PATTERNS = [
    'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ECONNREFUSED',
    'ENETUNREACH', 'ENETDOWN', 'EHOSTUNREACH', 'EPIPE', 'EAGAIN',
    'EBUSY', 'EIO', 'socket hang up', 'network', 'timeout', 'timed out'
];

const TRANSIENT_HTTP_CODES = [408, 429, 500, 502, 503, 504];

export const isTransientError = (err: any): boolean => {
    const status = err?.code || err?.status || err?.response?.status;
    if (typeof status === 'number' && TRANSIENT_HTTP_CODES.includes(status)) {
        return true;
    }
    const msg = `${err?.code || ''} ${err?.message || String(err)}`.toLowerCase();
    return TRANSIENT_ERROR_PATTERNS.some(pattern => msg.includes(pattern.toLowerCase()));
};

export interface RetryWithBackoffOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    retryOnlyIf?: (err: any) => boolean;
    label?: string;
}

/**
 * Retries an async operation with exponential backoff.
 * By default only retries transient (network/timeout/5xx/429) errors.
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryWithBackoffOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelayMs = 1000,
        backoffMultiplier = 3,
        retryOnlyIf = isTransientError,
        label = 'operation'
    } = options;

    let lastError: any;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (err: any) {
            lastError = err;
            if (attempt >= maxAttempts || !retryOnlyIf(err)) {
                break;
            }
            console.log(`retryWithBackoff:${label} attempt ${attempt}/${maxAttempts} failed (${err?.message || String(err)}). Retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= backoffMultiplier;
        }
    }
    throw lastError;
}
