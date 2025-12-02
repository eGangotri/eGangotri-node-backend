import { QuickStatus } from '../models/GDriveDownloadHistory';

/**
 * Utility functions for working with quickStatus array
 */

/**
 * Calculate cumulative statistics from quickStatus array
 * @param quickStatusArray - Array of QuickStatus objects
 * @returns Cumulative counts and statistics
 */
export function getCumulativeStats(quickStatusArray: QuickStatus[] = []) {
    if (!quickStatusArray || quickStatusArray.length === 0) {
        return {
            totalAttempts: 0,
            cumulativeSuccessCount: 0,
            cumulativeErrorCount: 0,
            cumulativeWrongSizeCount: 0,
            lastAttempt: null,
            firstAttempt: null,
            successRate: 'N/A',
            attempts: []
        };
    }

    let cumulativeSuccessCount = 0;
    let cumulativeErrorCount = 0;
    let cumulativeWrongSizeCount = 0;

    const attempts = quickStatusArray.map((qs, index) => {
        const successCount = typeof qs.success_count === 'number' 
            ? qs.success_count 
            : parseInt(String(qs.success_count || 0), 10);
            
        const errorCount = typeof qs.error_count === 'number'
            ? qs.error_count
            : parseInt(String(qs.error_count || 0), 10);
            
        const wrongSizeCount = typeof qs.dl_wrong_size_count === 'number'
            ? qs.dl_wrong_size_count
            : parseInt(String(qs.dl_wrong_size_count || 0), 10);

        cumulativeSuccessCount += successCount;
        cumulativeErrorCount += errorCount;
        cumulativeWrongSizeCount += wrongSizeCount;

        return {
            attemptNumber: index + 1,
            attemptDate: qs.attemptDate,
            successCount,
            errorCount,
            wrongSizeCount,
            status: qs.status,
            // Cumulative up to this attempt
            cumulativeSuccess: cumulativeSuccessCount,
            cumulativeErrors: cumulativeErrorCount,
            cumulativeWrongSize: cumulativeWrongSizeCount
        };
    });

    const lastAttempt = attempts[attempts.length - 1];
    const firstAttempt = attempts[0];

    return {
        totalAttempts: quickStatusArray.length,
        cumulativeSuccessCount,
        cumulativeErrorCount,
        cumulativeWrongSizeCount,
        lastAttempt,
        firstAttempt,
        successRate: 'N/A', // Will be calculated with totalCount
        attempts
    };
}

/**
 * Calculate success rate based on cumulative success and total count
 * @param cumulativeSuccessCount - Total successful downloads
 * @param totalCount - Total files to download
 * @returns Success rate as percentage string
 */
export function calculateSuccessRate(cumulativeSuccessCount: number, totalCount: number): string {
    if (!totalCount || totalCount === 0) {
        return 'N/A';
    }
    const rate = (cumulativeSuccessCount / totalCount) * 100;
    return rate.toFixed(2) + '%';
}

/**
 * Get remaining errors based on total count and cumulative success
 * @param totalCount - Total files to download
 * @param cumulativeSuccessCount - Total successful downloads
 * @returns Number of files still failing
 */
export function getRemainingErrors(totalCount: number, cumulativeSuccessCount: number): number {
    return Math.max(0, totalCount - cumulativeSuccessCount);
}

/**
 * Get complete download statistics including success rate and remaining errors
 * @param quickStatusArray - Array of QuickStatus objects
 * @param totalCount - Total files to download
 * @returns Complete statistics object
 */
export function getCompleteStats(quickStatusArray: QuickStatus[] = [], totalCount: number = 0) {
    const cumulativeStats = getCumulativeStats(quickStatusArray);
    
    return {
        ...cumulativeStats,
        totalCount,
        successRate: calculateSuccessRate(cumulativeStats.cumulativeSuccessCount, totalCount),
        remainingErrors: getRemainingErrors(totalCount, cumulativeStats.cumulativeSuccessCount),
        // Percentage of attempts (useful for tracking re-download efficiency)
        attemptEfficiency: cumulativeStats.totalAttempts > 1 
            ? `${cumulativeStats.totalAttempts} attempts to reach ${cumulativeStats.cumulativeSuccessCount}/${totalCount} success`
            : 'First attempt'
    };
}

/**
 * Get a summary of the last attempt
 * @param quickStatusArray - Array of QuickStatus objects
 * @returns Summary of the most recent attempt
 */
export function getLastAttemptSummary(quickStatusArray: QuickStatus[] = []) {
    if (!quickStatusArray || quickStatusArray.length === 0) {
        return null;
    }

    const lastQs = quickStatusArray[quickStatusArray.length - 1];
    const successCount = typeof lastQs.success_count === 'number' 
        ? lastQs.success_count 
        : parseInt(String(lastQs.success_count || 0), 10);
        
    const errorCount = typeof lastQs.error_count === 'number'
        ? lastQs.error_count
        : parseInt(String(lastQs.error_count || 0), 10);

    return {
        attemptNumber: quickStatusArray.length,
        attemptDate: lastQs.attemptDate,
        successCount,
        errorCount,
        status: lastQs.status,
        error: lastQs.error
    };
}
