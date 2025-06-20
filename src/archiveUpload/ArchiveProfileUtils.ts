import * as fs from 'fs';
import path from 'path'
import { ARCHIVE_METADATA_PROPERTIES_FILES, DEST_ROOT, LOCAL_FOLDERS_PROPERTIES_FILE, LOCAL_FOLDERS_PROPERTIES_FILES, SRC_ROOT } from './constants';
import { checkFolderExistsSync } from '../utils/FileUtils';


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

export const getFolderInSrcRootForProfile = (profile: string) => {
    if (profile && profile.length > 0 && LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.has(profile)) {
        return LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.get(profile)
    }
    else {
        ""
    }
}

export const getFolderInDestRootForProfile = (profile: string) => {
    if (profile && profile.length > 0 && LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST.has(profile)) {
        return LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST.get(profile)
    }
    else {
        ""
    }
}

//create this
export const HEADER_FOOTER_PROPERTIES_FILE: Map<string, string> = getFoldersCorrespondingToProfile(SRC_ROOT);

export const getHeaderAndFooterTextForProfile = (profile: string) => {
    const yes = (profile && profile.length > 0 && HEADER_FOOTER_PROPERTIES_FILE.has(profile))
    return yes ? HEADER_FOOTER_PROPERTIES_FILE.get(profile) : "";
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