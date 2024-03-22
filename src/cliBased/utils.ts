import * as fs from 'fs';
import path from 'path'
import { DEST_ROOT, LOCAL_FOLDERS_PROPERTIES_FILE, SRC_ROOT } from './constants';


const getFoldersCorrespondingToProfile = (root: string): Map<string, string> => {
    const properties = new Map<string, string>();
    if (!fs.existsSync(LOCAL_FOLDERS_PROPERTIES_FILE)) {
        console.log(`No Local Folder ${LOCAL_FOLDERS_PROPERTIES_FILE} found`);
        return properties;
    }
    const data = fs.readFileSync(LOCAL_FOLDERS_PROPERTIES_FILE, 'utf-8');
    const lines = data.split(/\r?\n/);
    lines.forEach((line) => {
        const [key, value] = line.split('=');
        const val = value?.replace(/\\\\/g, path.sep)
        if (key?.trim() && val?.trim()) {
            properties.set(key.trim(), val.trim());
        }
    });

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
    console.log(`LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST(${profile}) ${JSON.stringify(LOCAL_FOLDERS_PROPERTIES_FILE_FOR_DEST)}`)
    console.log(`LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC ${JSON.stringify(LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC)}`)
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
    if (profile && profile.length > 0 && HEADER_FOOTER_PROPERTIES_FILE.has(profile)) {
        return HEADER_FOOTER_PROPERTIES_FILE.get(profile)
    }
    else {
        ""
    }
}

// const pdfDumpFolder = LOCAL_FOLDERS_PROPERTIES_FILE_FOR_SRC.get("GANESH") || "";
// console.log(`pdfDumpFolder ${pdfDumpFolder}`);
//yarn run profileFolder