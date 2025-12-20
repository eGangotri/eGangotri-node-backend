import { getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import { getPathOrSrcRootForProfile } from "./FileUtils";
import * as path from "path";

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
