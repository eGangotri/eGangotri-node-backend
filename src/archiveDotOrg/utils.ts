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

const ARCHIVE_EXCEL_HEADER = ["Serial No.", "Link", "All Downloads Link Page", "Pdf Download Link", "Title-Archive", "Original Title", "Description",
"Subject","Date","Acct", "Identifier",
     "Type", "Media Type", "Size", "Size Formatted", "Email-User"];

export const generateExcel = async (links: LinkData[]): Promise<string> => {
    const excelFileName = `${links[0].acct}(${links.length})`;
    const worksheet = utils.json_to_sheet(linkDataToExcelFormat(links),
        { header: ARCHIVE_EXCEL_HEADER });

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Links");
    const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}.xlsx`
    console.log(`Writing to ${excelPath}`);
    await writeFile(workbook, excelPath);
    return excelPath;
}

const linkDataToExcelFormat = (links: LinkData[]) => {
    return links.map((link, index) => {
        let counter = 0;
        return {
            [ARCHIVE_EXCEL_HEADER[counter++]]: `${index + 1}`,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.link,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.allFilesDownloadUrl,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.pdfDownloadUrl,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.title,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.originalTitle,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.description,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.subject,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.publicdate,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.acct,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.uniqueIdentifier,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.hit_type,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.mediatype,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.item_size,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.item_size_formatted,
            [ARCHIVE_EXCEL_HEADER[counter++]]: link.email,
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

export const extractLinkedData = async (_hitsHits: Hit[], email: string, _archiveAcctName:string) => {
    const _linkData: LinkData[] = [];
    for (const hit of _hitsHits) {
        const identifier = hit.fields.identifier;
        const pdfName = await extractPdfName(identifier);
        const originalTitle = pdfName.replace(".pdf", "");
        _linkData.push(
            {
                link: `${ARCHIVE_DOT_ORG_DETAILS_PREFIX}${identifier}`,
                title: hit.fields.title,
                originalTitle: originalTitle,
                description: hit.fields.description,
                uniqueIdentifier: identifier,
                allFilesDownloadUrl: `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}`,
                pdfDownloadUrl: `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}/${pdfName}`,
                publicdate: `${hit.fields.publicdate}`,
                subject: hit.fields?.subject?.join(","),
                acct: _archiveAcctName,
                hit_type: hit.hit_type,
                mediatype: hit.fields.mediatype,
                item_size: hit.fields.item_size,
                item_size_formatted: sizeInfo(hit.fields.item_size),
                email
            }
        )
    }
    return _linkData
}

