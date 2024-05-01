import os from 'os';
import { utils, writeFile } from 'xlsx';
import { ExcelHeaderType, HitsEntity, LinkData } from './types';
import { sizeInfo } from '../mirror/FrontEndBackendCommonCode';
import moment from 'moment';
import { DD_MM_YYYY_FORMAT } from '../utils/constants';
import { FETCH_ACRHIVE_METADATA_COUNTER } from './archiveScraper';

export const ARCHIVE_EXCEL_PATH = `${os.homedir()}\\Downloads`;
export const ARCHIVE_DOT_ORG_PREFIX = "https://archive.org";
export const ARCHIVE_DOT_ORG_DETAILS_PREFIX = "https://archive.org/details/";
export const ARCHIVE_DOT_ORG_DWONLOAD_PREFIX = "https://archive.org/download/";

export const extractArchiveAcctName = (_urlOrIdentifier: string) => {
    if (_urlOrIdentifier?.includes('@')) {
        return _urlOrIdentifier?.split('@')[1];
    }
    return _urlOrIdentifier
}

let ARCHIVE_EXCEL_HEADER =
{
    "serialNo": "Serial No.",
    "link": "Link",
    "allDwnldsLink": "All Downloads Link Page",
    "pdfDwnldLink": "Pdf Download Link",
    "pageCount": "Page Count",
    "originalTitle": "Original Title",
    "titleArchive": "Title-Archive",
    "size": "Size",
    "sizeFormatted": "Size Formatted",
    "views": "Views",
    "subject": "Subject",
    "description": "Description",
    "date": "Date",
    "acct": "Acct",
    "identifier": "Identifier",
    "type": "Type",
    "mediaType": "Media Type",
    "emailUser": "Email-User"
};

export const generateExcel = async (links: LinkData[],
    limitedFields = false): Promise<string> => {
    try {

        const excelFileName = `${links[0].acct}(${links.length})`;
        const excelHeader = Object.values(ARCHIVE_EXCEL_HEADER);
        if (limitedFields) {
            excelHeader.splice(3, 3)
        }
        const worksheet = utils.json_to_sheet(linkDataToExcelFormat(links, ARCHIVE_EXCEL_HEADER, limitedFields),
            { header: excelHeader });

        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Links");
        const timeNow = moment().format(DD_MM_YYYY_FORMAT);
        const excelPath = `${ARCHIVE_EXCEL_PATH}\\${excelFileName}${limitedFields ? "-ltd" : ""}-${timeNow}.xlsx`
        console.log(`Writing to ${excelPath}`);
        await writeFile(workbook, excelPath);
        return excelPath;
    }
    catch (err) {
        console.log(`Error while writing to excel ${err.message}`);
        throw err;
    }
}

const linkDataToExcelFormat = (links: LinkData[], archiveExcelHeader: ExcelHeaderType,
    limitedFields = false) => {
    return links.map((link, index) => {
        const obj = {
            [archiveExcelHeader.serialNo]: `${index + 1}`,
            [archiveExcelHeader.link]: link.link,
            [archiveExcelHeader.allDwnldsLink]: link.allFilesDownloadUrl,
            [archiveExcelHeader.titleArchive]: link.titleArchive,
            [archiveExcelHeader.views]: link.downloads,
            [archiveExcelHeader.description]: link.description,
            [archiveExcelHeader.subject]: link.subject,
            [archiveExcelHeader.date]: link.publicdate,
            [archiveExcelHeader.acct]: link.acct,
            [archiveExcelHeader.identifier]: link.uniqueIdentifier,
            [archiveExcelHeader.type]: link.hit_type,
            [archiveExcelHeader.mediaType]: link.mediatype,
            [archiveExcelHeader.size]: link.item_size,
            [archiveExcelHeader.sizeFormatted]: link.item_size_formatted,
            [archiveExcelHeader.emailUser]: link.email,
        }
        if (limitedFields) {
            return obj
        }
        else {
            return {
                ...obj,
                [archiveExcelHeader.pdfDwnldLink]: link.pdfDownloadUrl,
                [archiveExcelHeader.originalTitle]: link.originalTitle,
                [archiveExcelHeader.pageCount]: link.pdfPageCount
            }
        }
    })
}

export const extractEmail = async (identifier: string) => {
    const response = await fetch(`https://archive.org/metadata/${identifier}`)
    const _email = await response.json();
    return _email.metadata.uploader
}

export const extractPdfMetaData = async (identifier: string) => {
    const response = await fetch(`https://archive.org/metadata/${identifier}`)
    const metadata = await response.json();
    const pdfRow = metadata.files.filter((file: { format: string, name: string }) => {
        return file.format.endsWith("PDF") && file.name.endsWith(".pdf") && !file.name.includes("_text.pdf");
    });
    const zippedFile = metadata.files.filter((file: any) => {
        return file.format.startsWith("Single Page");
    });
    return {
        pdfName: (pdfRow && pdfRow.length > 0) ? pdfRow[0]?.name : "",
        pdfPageCount: (zippedFile && zippedFile.length > 0) ? zippedFile[0]?.filecount : 0
    }
}

export const extractLinkedData = async (_hitsHits: HitsEntity[],
    email: string,
    _archiveAcctName: string,
    limitedFields = false) => {
    const _linkData: LinkData[] = [];
    for (const hit of _hitsHits) {
        FETCH_ACRHIVE_METADATA_COUNTER.value++;
        const identifier = hit.fields.identifier;
        let pdfName = ""
        let pdfPageCount = 0
        console.log(`${FETCH_ACRHIVE_METADATA_COUNTER.value}/${FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal}).Fetching metadata for ${hit.fields.title} `)
        if (!limitedFields) {
            try {
                const pdfMetaData = await extractPdfMetaData(identifier);
                pdfName = pdfMetaData?.pdfName || "";
                pdfPageCount = pdfMetaData?.pdfPageCount || 0;
            }
            catch (err) {
                console.log(`Error while extracting pdf metadata ${err}`);
                //throw err;
            }
        }

        const originalTitle = pdfName.replace(".pdf", "");
        const obj: LinkData = {
            link: `${ARCHIVE_DOT_ORG_DETAILS_PREFIX}${identifier}`,
            titleArchive: hit.fields.title,
            description: hit.fields.description,
            uniqueIdentifier: identifier,
            allFilesDownloadUrl: `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}`,
            publicdate: moment(hit.fields.publicdate).format(DD_MM_YYYY_FORMAT),
            subject: hit.fields?.subject?.join(","),
            acct: _archiveAcctName,
            hit_type: hit.hit_type,
            mediatype: hit.fields.mediatype,
            item_size: hit.fields.item_size,
            item_size_formatted: sizeInfo(hit.fields.item_size),
            email,
            pdfPageCount: pdfPageCount,
            downloads: hit?.fields?.downloads?.toString() || "0"
        }
        if (!limitedFields) {
            obj.originalTitle = originalTitle;
            obj.pdfDownloadUrl = `${ARCHIVE_DOT_ORG_DWONLOAD_PREFIX}${identifier}/${pdfName}`;
        }

        _linkData.push(obj)
    }
    return _linkData
}

