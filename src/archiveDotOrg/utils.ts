import os from 'os';
import { utils, writeFile } from 'xlsx';
import { ArchiveRes, Hit, LinkData } from './types';
import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';

export const ARCHIVE_EXCEL_PATH = `${os.homedir()}\\Downloads`;
export const ARCHIVE_DOT_ORG_PREFIX = "https://archive.org";
export const ARCHIVE_DOT_ORG_DETAILS_PREFIX = "https://archive.org/details/";

export const extractArchiveAcctName = (_urlOrIdentifier: string) => {
    if (_urlOrIdentifier.includes('@')) {
        return _urlOrIdentifier.split('@')[1];
    }
    return _urlOrIdentifier
}

const ARCHIVE_EXCEL_HEADER = ["Serial No.", "Link", "Title", "Description", "Acct", "Date", "Subject", "Type", "Media Type", "Size", "Size Formatted", "Email-User"];

export const generateExcel = async (links: LinkData[], _archiveAcctName: string): Promise<string> => {
    const excelFileName = `${_archiveAcctName}(${links.length})`;
    const worksheet = utils.json_to_sheet(links.map((link, index) => (
        {
            [ARCHIVE_EXCEL_HEADER[0]]: `${index + 1}`,
            [ARCHIVE_EXCEL_HEADER[1]]: link.link,
            [ARCHIVE_EXCEL_HEADER[2]]: link.title,
            [ARCHIVE_EXCEL_HEADER[3]]: link.description,
            [ARCHIVE_EXCEL_HEADER[4]]: _archiveAcctName,
            [ARCHIVE_EXCEL_HEADER[5]]: link.publicdate,
            [ARCHIVE_EXCEL_HEADER[6]]: link.subject,
            [ARCHIVE_EXCEL_HEADER[7]]: link.hit_type,
            [ARCHIVE_EXCEL_HEADER[8]]: link.mediatype,
            [ARCHIVE_EXCEL_HEADER[9]]: link.item_size,
            [ARCHIVE_EXCEL_HEADER[10]]: link.item_size_formatted,
            [ARCHIVE_EXCEL_HEADER[11]]: link.email,
        })),
        { header: ARCHIVE_EXCEL_HEADER });

    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Links");
    const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}.xlsx`
    console.log(`Writing to ${excelPath}`);
    await writeFile(workbook, excelPath);
    return excelPath;
}

export const extractEmail = async (identifier:string)=> {
    const response = await fetch(`https://archive.org/metadata/${identifier}`)
    const _email = await response.json();
    return _email.metadata.uploader
}

export const extractLinkedData = (_hitsHits: Hit[], email:string) => {
    const _linkData: LinkData[] = [];
    for (const hit of _hitsHits) {
        hit.fields.identifier;
        hit.fields.title
        _linkData.push(
            {
                link: `${ARCHIVE_DOT_ORG_DETAILS_PREFIX}${hit.fields.identifier}`,
                title: hit.fields.title,
                description: hit.fields.description,
                publicdate: `${hit.fields.publicdate}`,
                subject: hit.fields?.subject?.join(","),
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
