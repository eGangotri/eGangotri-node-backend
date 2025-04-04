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
    LICENSE_PICKER_DIV: 'license-picker',
    LICENSE_PICKER_RADIO_OPTION: 'license_picker',
    CHOOSE_FILES_BUTTON: 'choose-files-to-upload',
    PAGE_URL: 'page-url',
    PAGE_URL_INPUT: 'page-url-input',
    PAGE_URL_ITEM_ID: 'page-url-item-id',
    UPLOAD_BUTTON: 'upload-and-create-your-item',
    COLLECTION_DROPDOWN: 'collection',
    MEDIA_TYPE: 'mediatypecollection'
};

export const ARCHIVE_LOGIN_URL = 'https://archive.org/account/login';
export const ARCHIVE_UPLOAD_URL = 'https://archive.org/upload/';
