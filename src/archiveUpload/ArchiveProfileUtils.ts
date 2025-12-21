import * as fs from 'fs';
import path from 'path'
import {
    ARCHIVE_METADATA_PROPERTIES_FILES,
    DEST_ROOT,
    LOCAL_FOLDERS_PROPERTIES_FILES,
    SRC_ROOT
} from './constants';
import { checkFolderExistsSync } from '../utils/FolderUtils';

const getFoldersCorrespondingToProfile = (root: string): Map<string, string> => {
    const properties = new Map<string, string>();
    for (const file of LOCAL_FOLDERS_PROPERTIES_FILES) {
        if (!checkFolderExistsSync(file)) {
            console.log(`No Local Folder ${file} found`);
            continue;
        }
        const data = fs.readFileSync(file, 'utf-8');
        const lines = data.split(/\r?\n/);
        lines.forEach((line) => {
            const [key, value] = line.split('=');
            const val = value?.replace(/\\\\/g, path.sep)
            if (key?.trim() && val?.trim()) {
                properties.set(key.trim(), val.trim());
            }
        });
    }

    const profileAndFolder = new Map<string, string>();
    const rootPath = properties.get(root);
    for (const [key, _path] of properties.entries()) {
        if (
            !key.includes('.') &&
            key !== 'SRC_ROOT' &&
            key !== 'DEST_ROOT' &&
            key !== 'DEST_OTRO_ROOT'
        ) {
            if (_path.includes(':') || _path.startsWith('/')) {
                profileAndFolder.set(key, _path);
            } else {
                const fullPath = `${rootPath}${path.sep}${_path}`;
                profileAndFolder.set(key, fullPath);
            }
        }
    }
    return profileAndFolder;
}
export const LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC: Map<string, string> = getFoldersCorrespondingToProfile(SRC_ROOT);
export const LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST: Map<string, string> = getFoldersCorrespondingToProfile(DEST_ROOT);

export const getFolderFromProfile = (profile: string, properties: Map<string, string>) => {
    const key = profile?.trim();
    if (key && key.length > 0 && properties.has(key)) {
        return properties.get(key);
    }
    return "";
}

export const getFolderInSrcRootForProfile = (profile: string) => {
    return getFolderFromProfile(profile, LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC);
}

export const getFolderInDestRootForProfile = (profile: string) => {
    return getFolderFromProfile(profile, LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST);
}

//create this
export const HEADER_FOOTER_PROPERTIES_FILE: Map<string, string> = getFoldersCorrespondingToProfile(SRC_ROOT);

export const getHeaderAndFooterTextForProfile = (profile: string) => {
    const key = profile?.trim();
    const yes = (key && key.length > 0 && HEADER_FOOTER_PROPERTIES_FILE.has(key))
    return yes ? HEADER_FOOTER_PROPERTIES_FILE.get(key) : "";
}

const getArchiveMetadataProperties = () => {
    const properties = new Map<string, string>();
    for (const file of ARCHIVE_METADATA_PROPERTIES_FILES) {
        if (!checkFolderExistsSync(file)) {
            console.log(`No Local Folder ${file} found`);
            continue;
        }
        const data = fs.readFileSync(file, 'utf-8');
        const lines = data.split(/\r?\n/);
        lines.forEach((line) => {
            const [key, value] = line.split('=');
            const val = value?.replace(/\\\\/g, path.sep)
            if (key?.trim() && val?.trim()) {
                properties.set(key.trim(), val.trim());
            }
        });
    }
    console.log(`archive.metadata.properties ${properties.size} items`);
    return properties;
}

let ARCHIVE_METADA_PROPERTIES: Map<string, string>;
export const getArchiveMetadataForProfile = (profile: string) => {
    if (!ARCHIVE_METADA_PROPERTIES) {
        ARCHIVE_METADA_PROPERTIES = getArchiveMetadataProperties();
    }
    const subject = ARCHIVE_METADA_PROPERTIES.get(`${profile}.subjects` || "");
    const description = ARCHIVE_METADA_PROPERTIES.get(`${profile}.description` || "");
    const creator = ARCHIVE_METADA_PROPERTIES.get(`${profile}.creator` || "");

    return {
        subject, description, creator
    }
}

export const isValidArchiveProfile = (profile: string) => {
    return LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.has(profile?.trim());
}