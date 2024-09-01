import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { getAllPDFFilesWithIgnorePathsSpecified } from '../utils/FileStatsUtils';
import { zipFiles } from '../services/zipService';
import _ from 'lodash';
import { AI_SERVER } from '../db/connection';
import { USER_HOME } from 'archiveUpload/constants';

const DD_MM_YYYY_HH_MMFORMAT = 'DD-MM-YYYY-HH-mm'; // Define your date format

export const zipAndSendFormData = async (folderPath: string, resp: any) => {
    try {
        const _ouptutZipPath = await zipFilesInFolder(folderPath);
        const data = await sendFormDataToAiServer(_ouptutZipPath);
        resp.status(200).send({
            response: {
                data,
                _ouptutZipPath: _ouptutZipPath,
            }
        });
    } catch (err: any) {
        console.log('Error', err);
        resp.status(400).send(err);
    }
}

export const zipFilesInFolder = async (folderPath: string) => {
    try {
        const _resp = await getAllPDFFilesWithIgnorePathsSpecified(folderPath);
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        const _files = _resp.map(x => x.absPath);
        const _ouptutZipPath = path.join(__dirname, `${USER_HOME}/output-${timeComponent}.zip`);
        await zipFiles(_files, _ouptutZipPath);
        return _ouptutZipPath;
    } catch (err: any) {
        console.log('Error', err);
        throw err;
    }
}

export const sendFormDataToAiServer = async (_ouptutZipPath: string) => {
    try {

        // Create form-data
        const form = new FormData();
        form.append('zip_file', fs.createReadStream(_ouptutZipPath));

        // Make POST request with axios
        const response = await axios.post(AI_SERVER, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        const data = response.data
        console.log(`Upload Response: ${response.data} ${JSON.stringify(data)} ${response.status}`);
        return data;
    } catch (err: any) {
        console.log('Error', err);
        throw err;
    }
}
