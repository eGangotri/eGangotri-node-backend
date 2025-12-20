import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { getPathOrSrcRootForProfile } from "./FileUtils";
import * as path from "path";


export const RENAMER_SUFFIX = "-renamer"
/**
 * Resolves a profile path that may contain a pattern like %NAGITHA%\c\d
 * Converts %VARIABLE% to the actual folder path using getFolderInSrcRootForProfile
 * @param profile - The profile string that may contain %VARIABLE%\path pattern
 * @returns The resolved path or the original profile if no pattern is found
 */
export const resolveProfilePathWithPercentages = (profile: string): string => {
    // Check if profile contains a pattern like %VARIABLE%\path or %VARIABLE%/path
    const percentPattern = /^%([^%]+)%[\\\/](.+)$/;
    const match = profile.match(percentPattern);

    if (match) {
        const variableName = match[1]; // e.g., "NAGITHA"
        const remainingPath = match[2]; // e.g., "c\d"

        // Get the base folder for the profile variable
        const baseFolder = getFolderInSrcRootForProfile(variableName);

        // Combine the base folder with the remaining path
        return path.join(baseFolder, remainingPath);
    }

    // If no pattern found, return original profile
    return getPathOrSrcRootForProfile(profile);
}

/**
 * Processes output suffixes for AI renamer
 * @param outputSuffixes - The output suffixes string (comma-separated or single)
 * @param reducedFoldersList - List of reduced folders
 * @param srcFoldersCount - Number of source folders
 * @returns Processed list of output suffixes
 * @throws Error if suffix count doesn't match source folder count
 */
export const processOutputSuffixes = (
    outputSuffixes: string | undefined,
    reducedFoldersList: string[],
    srcFoldersCount: number
): string[] => {
    let outputSuffixesList: string[] = [];

    if (!outputSuffixes) {
        console.log("No output suffix provided, using default: -renamer");
        reducedFoldersList.forEach((folder: string) => {
            outputSuffixesList.push(`${path.basename(folder)}${RENAMER_SUFFIX}`);
        });
    } else {
        outputSuffixesList = outputSuffixes.split(",").map((suffix: string) => suffix.trim());
        console.log(`outputSuffixList(${outputSuffixesList.length}): ${outputSuffixesList}`);

        if (srcFoldersCount !== outputSuffixesList.length) {
            // If a single suffix is provided, apply it to all src folders
            if (outputSuffixesList.length === 1) {
                outputSuffixesList = Array(srcFoldersCount).fill(outputSuffixesList[0]);
            } else {
                throw new Error("OutputSuffixes Count doesnt match Src Folder Count");
            }
        }
    }

    return outputSuffixesList;
}

/**
 * Aggregates renaming results into a standardized format
 * @param renamingResults - Raw renaming results from AI processing
 * @returns Aggregated results with standardized fields
 */
export const aggregateRenamingResults = (renamingResults: any[]): any[] => {
    return renamingResults.map((result: any) => ({
        runId: result.runId,
        success: result.success,
        processedCount: result.processedCount,
        successCount: result.successCount,
        failedCount: result.failedCount,
        errorCount: result.errorCount ?? 0,
        metaDataAggregated: result.metaDataAggregated,
        renamingResults: result.renamingResults,
        error: result.error,
    }));
}

/**
 * Calculates summary statistics from aggregated results
 * @param aggregatedResults - Aggregated renaming results
 * @param renamingResults - Raw renaming results
 * @returns Summary object with counts and overall success status
 */
export const generateRenamingSummary = (aggregatedResults: any[], renamingResults: any[]) => {
    const summary = aggregatedResults.reduce(
        (acc: { runs: number; processedCount: number; successCount: number; failedCount: number; errorCount: number }, cur: any) => {
            acc.runs += 1;
            acc.processedCount += Number(cur.processedCount || 0);
            acc.successCount += Number(cur.successCount || 0);
            acc.failedCount += Number(cur.failedCount || 0);
            acc.errorCount += Number(cur.errorCount || 0);
            return acc;
        },
        { runs: 0, processedCount: 0, successCount: 0, failedCount: 0, errorCount: 0 }
    );

    const _processedCount = renamingResults.map((result: any) => result.processedCount).join(",");
    const _successCount = renamingResults.map((result: any) => result.successCount).join(",");
    const _failedCount = renamingResults.map((result: any) => result.failedCount).join(",");
    const _errorCount = renamingResults.map((result: any) => result.errorCount).join(",");

    const overallSuccess = summary.failedCount === 0 && aggregatedResults.every((r: any) => r.success === true);

    const msg = {
        //       title: `${srcFoldersList.length} folders processed in ${_renamingResults.length} operations`,
        overallSuccess,
        _processedCount: `${_processedCount} (${summary.processedCount} )`,
        _successCount: `${_successCount} (${summary.successCount})`,
        _failedCount: `${_failedCount} (${summary.failedCount})`,
        _errorCount: `${_errorCount} (${summary.errorCount})`,
    }
    return {
        "aggregatedSummary": msg,
        "aggregatedResults": aggregatedResults,
        "summary": summary,
        "results": renamingResults,
    }
}
