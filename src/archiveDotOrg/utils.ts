import os from 'os';
import { utils, writeFile } from 'xlsx';
import { ArchiveRes, Hit, LinkData } from './types';
import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';

export const ARCHIVE_EXCEL_PATH = `${os.homedir()}\\Downloads`;
export const ARCHIVE_DOT_ORG_PREFIX = "https://archive.org";
export const ARCHIVE_DOT_ORG_DETAILS_PREFIX = "https://archive.org/details/";
export const ARCHIVE_DOT_ORG_DWONLOAD_PREFIX = "https://archive.org/download/";

export const extractArchiveAcctName = (_urlOrIdentifier: string) => {
    if (_urlOrIdentifier.includes('@')) {
        return _urlOrIdentifier.split('@')[1];
    }
    return _urlOrIdentifier
}

let ARCHIVE_EXCEL_HEADER = ["Serial No.", "Link", "All Downloads Link Page", "Pdf Download Link",
    "Original Title",
    "Title-Archive",
    "Description",
    "Subject", "Date", "Acct", "Identifier",
    "Type", "Media Type", "Size", "Size Formatted", "Email-User"];

export const generateExcel = async (links: LinkData[],
    limitedFields = false): Promise<string> => {
    const excelFileName = `${links[0].acct}(${links.length})`;
    if (limitedFields) {
        ARCHIVE_EXCEL_HEADER.splice(3, 2)
    }
    const worksheet = utils.json_to_sheet(linkDataToExcelFormat(links, ARCHIVE_EXCEL_HEADER, limitedFields),
        { header: ARCHIVE_EXCEL_HEADER });

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Links");
    const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}${limitedFields?"-ltd":""}.xlsx`
    console.log(`Writing to ${excelPath}`);
    await writeFile(workbook, excelPath);
    return excelPath;
}

const linkDataToExcelFormat = (links: LinkData[], archiveExcelHeader: string[],
    limitedFields = false) => {
    return links.map((link, index) => {
        let counter = 0;
        if (limitedFields) {
            return {
                [archiveExcelHeader[counter++]]: `${index + 1}`,
                [archiveExcelHeader[counter++]]: link.link,
                [archiveExcelHeader[counter++]]: link.allFilesDownloadUrl,
                [archiveExcelHeader[counter++]]: link.titleArchive,
                [archiveExcelHeader[counter++]]: link.description,
                [archiveExcelHeader[counter++]]: link.subject,
                [archiveExcelHeader[counter++]]: link.publicdate,
                [archiveExcelHeader[counter++]]: link.acct,
                [archiveExcelHeader[counter++]]: link.uniqueIdentifier,
                [archiveExcelHeader[counter++]]: link.hit_type,
                [archiveExcelHeader[counter++]]: link.mediatype,
                [archiveExcelHeader[counter++]]: link.item_size,
                [archiveExcelHeader[counter++]]: link.item_size_formatted,
                [archiveExcelHeader[counter++]]: link.email,
            }
        }
        else return {
            [archiveExcelHeader[counter++]]: `${index + 1}`,
            [archiveExcelHeader[counter++]]: link.link,
            [archiveExcelHeader[counter++]]: link.allFilesDownloadUrl,
            [archiveExcelHeader[counter++]]: link.pdfDownloadUrl,
            [archiveExcelHeader[counter++]]: link.originalTitle,
            [archiveExcelHeader[counter++]]: link.titleArchive,
            [archiveExcelHeader[counter++]]: link.description,
            [archiveExcelHeader[counter++]]: link.subject,
            [archiveExcelHeader[counter++]]: link.publicdate,
            [archiveExcelHeader[counter++]]: link.acct,
            [archiveExcelHeader[counter++]]: link.uniqueIdentifier,
            [archiveExcelHeader[counter++]]: link.hit_type,
            [archiveExcelHeader[counter++]]: link.mediatype,
            [archiveExcelHeader[counter++]]: link.item_size,
            [archiveExcelHeader[counter++]]: link.item_size_formatted,
            [archiveExcelHeader[counter++]]: link.email,
        }
    })
}

export const extractEmail = async (identifier: string) => {
    const response = await fetch(`https://archive.org/metadata/${identifier}`)
    const _email = await response.json();
    return _email.metadata.uploader
}

export const extractPdfName = async (identifier: string) => {
    const response = await fetch(`https://archive.org/metadata/${identifier}`)
    const metadata = await response.json();
    for (const file of metadata.files) {
        if (file.name.endsWith(".pdf")) {
            return file.name
        }
    }
    return ""
}

export const extractLinkedData = async (_hitsHits: Hit[],
    email: string,
    _archiveAcctName: string,
    limitedFields = false) => {
    const _linkData: LinkData[] = [];
    for (const hit of _hitsHits) {
        const identifier = hit.fields.identifier;
        let pdfName = ""
        console.log(`limitedFields ${limitedFields}`)
        if (!limitedFields) {
            pdfName = await extractPdfName(identifier);
            console.log(`extractPdfName ${limitedFields} ${pdfName}`)
        }
        const originalTitle = pdfName.replace(".pdf", "");
        const obj: LinkData = {
            link: `${ARCHIVE_DOT_ORG_DETAILS_PREFIX}${identifier}`,
            titleArchive: hit.fields.title,
            description: hit.fields.description,
            uniqueIdentifier: identifier,
            allFilesDownloadUrl: `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}`,
            publicdate: `${hit.fields.publicdate}`,
            subject: hit.fields?.subject?.join(","),
            acct: _archiveAcctName,
            hit_type: hit.hit_type,
            mediatype: hit.fields.mediatype,
            item_size: hit.fields.item_size,
            item_size_formatted: sizeInfo(hit.fields.item_size),
            email
        }
        if (!limitedFields) {
            obj.originalTitle = originalTitle;
            obj.pdfDownloadUrl = `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}/${pdfName}`;
        }

        _linkData.push(obj)
    }
    return _linkData
}

