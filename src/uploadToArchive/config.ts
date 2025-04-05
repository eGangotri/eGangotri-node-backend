import { UploadConfig } from './types';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const DEFAULT_CONFIG: UploadConfig = {
    timeoutInSeconds: 20,
    maxUploadFailures: 5,
    defaultSubjectDesc: '',
    chromePath: process.env.CHROME_PATH || undefined
};

export const SELECTORS = {
    LICENSE_PICKER_DIV: 'license_picker',
    LICENSE_PICKER_RADIO_OPTION: 'license_radio_publicdomain',
    CHOOSE_FILES_BUTTON: 'file_input_initial',
    PAGE_URL: 'item_name',
    PAGE_URL_INPUT: 'item_name_input',
    PAGE_URL_ITEM_ID: 'item_name_text',
    UPLOAD_BUTTON: 'upload_button',
    COLLECTION_DROPDOWN: 'collection_select',
    MEDIA_TYPE: 'mediatype_selector'
};

export const ARCHIVE_LOGIN_URL = 'https://archive.org/account/login';
export const ARCHIVE_UPLOAD_URL = 'https://archive.org/upload/';
