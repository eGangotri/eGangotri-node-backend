import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import moment from 'moment';
import { getAllPDFFilesWithIgnorePathsSpecified } from '../utils/FileStatsUtils';
import { zipFiles } from '../services/zipService';
import _ from 'lodash';
import { AI_SERVER } from '../db/connection';
import { USER_HOME } from '../archiveUpload/constants';
import { aksharaMukhaAutoDetectScriptToRomanColloguial } from '../aksharamukha/convert';
import path from 'path';

const DD_MM_YYYY_HH_MMFORMAT = 'DD-MM-YYYY-HH-mm'; // Define your date format
const FIRST_N_PAGE_COUNT = 7;
export interface AiResponse {
    results?: AIResult[]
    zip_file?: string[]
}
export interface AIResult {
    pdf_file: string
    author: string
    publisher: string
    publication_year: string
    title: string
}



/*
{
    "results": [
        {
            "pdf_file": "/var/www/other/authornameextractor/media/Extracted_books/the-power-rhonda-byrne (1).pdf",
            "author": "Rhonda Byrne",
            "publisher": "Simon & Schuster",
            "publication_year": "2010",
            "title": "THE POWER."
        },
        {
            "pdf_file": "/var/www/other/authornameextractor/media/Extracted_books/Four-Steps-to-Forgiveness-William-Fergus-Martin.pdf",
            "author": "WILLIAM FERGUS MARTIN",
            "publisher": "The Global Forgiveness Initiative",
            "publication_year": "2020",
            "title": "Four Steps to Forgiveness A way to happiness, freedom and success."
        }
    ]

    or 
    "zip_file": [
        "The submitted data was not a file. Check the encoding type on the form."
    ]
}
*/
export const zipAndSendFormData = async (folderPath: string, resp: any) => {
    try {
        const _ouptutZipPath = await zipFilesInFolder(folderPath);
        const data: AiResponse = await sendFormDataToAiServer(_ouptutZipPath);

        if (data?.zip_file !== undefined) {
            resp.status(400).send(data.zip_file);
        }

        const pdfNames = []
        _.map(data.results, (aiResult: AIResult) => {
            const pdfName = `${aiResult?.title} by ${aiResult.author} ${aiResult.publication_year} - ${aiResult.publisher}.pdf`;
            const romanColloquial = aksharaMukhaAutoDetectScriptToRomanColloguial(pdfName)
            console.log(`pdfName: ${pdfName} romanColloquial: ${romanColloquial}`);
            pdfNames.push({ pdfName, romanColloquial });
        });

        resp.status(200).send({
            response: {
                pdfNames,
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
        const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)
        const outputDir = path.join(USER_HOME, 'Downloads', '_output', `output-${timeComponent}`);
        // Create the output directory if it does not exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        //await extractFirstAndLastNPages([folderPath], outputDir, FIRST_N_PAGE_COUNT, 0);
        const _resp = await getAllPDFFilesWithIgnorePathsSpecified(folderPath);
        const _files = _resp.map(x => x.absPath);
        const _ouptutZipPath = path.join(outputDir, `firstNPages.zip`);

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

export const modifyData = async (data: string) => {

}