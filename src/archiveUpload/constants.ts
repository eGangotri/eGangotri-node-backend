import path from 'path'

export const SRC_ROOT = "SRC_ROOT"
export const DEST_ROOT = "DEST_ROOT"
export const DEST_OTRO_ROOT = "DEST_OTRO_ROOT"

export const USER_HOME = process.env['HOME'];
export const EGANGOTRI_BASE_DIR = `${USER_HOME}${path.sep}eGangotri`;
export const PROPERTIES = ".properties"
export const LOCAL_FOLDERS_PROPERTIES_FILE = `${EGANGOTRI_BASE_DIR}${path.sep}localFolders${PROPERTIES}`;
export const ARCHIVE_METADATA_PROPERTIES_FILE = `${EGANGOTRI_BASE_DIR}${path.sep}archiveMetadata${PROPERTIES}`;
