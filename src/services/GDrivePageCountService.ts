import * as xlsx from 'xlsx';
import pLimit from 'p-limit';
import { drive_v3 } from 'googleapis';
import { SHEET_NAME, numPages, titleInGoogleDrive, linkToFileLocation } from '../cliBased/googleapi/_utils/constants';
import { fetchPdfPageCountFromGDrive } from '../cliBased/googleapi/service/GoogleApiService';
import { extractGoogleDriveId } from '../mirror/GoogleDriveUtilsCommonCode';

const MAX_SAMPLE_TITLES = 10;

interface MissingPageCountRow {
    rowIdx: number; // 0-based index into the aoa rows (header is row 0)
    title: string;
    link: string;
    fileId: string;
}

export interface RepopulateReport {
    status: string;
    excelPath: string;
    totalDataRows: number;
    missingPageCountCount: number;
    sampleTitlesOfMissing: string[];
    repopulatedCount: number;
    stillFailingCount: number;
    summary: string;
    failures: { title: string; link: string; error: string }[];
}

export const findMissingPageCountAndRepopulate = async (excelPath: string, drive: drive_v3.Drive): Promise<RepopulateReport> => {
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames.includes(SHEET_NAME) ? SHEET_NAME : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    if (!rows || rows.length < 2) {
        return {
            status: "failed",
            excelPath,
            totalDataRows: 0,
            missingPageCountCount: 0,
            sampleTitlesOfMissing: [],
            repopulatedCount: 0,
            stillFailingCount: 0,
            summary: "No data rows found in Excel",
            failures: [],
        };
    }

    const header = rows[0].map((h: any) => `${h}`.trim());
    const pagesColIdx = header.indexOf(numPages);
    const titleColIdx = header.indexOf(titleInGoogleDrive);
    const linkColIdx = header.indexOf(linkToFileLocation);

    if (pagesColIdx === -1 || titleColIdx === -1 || linkColIdx === -1) {
        return {
            status: "failed",
            excelPath,
            totalDataRows: rows.length - 1,
            missingPageCountCount: 0,
            sampleTitlesOfMissing: [],
            repopulatedCount: 0,
            stillFailingCount: 0,
            summary: `Mandatory headers missing. Need "${numPages}", "${titleInGoogleDrive}" and "${linkToFileLocation}". Found: ${header.join(", ")}`,
            failures: [],
        };
    }

    const missingRows: MissingPageCountRow[] = [];
    for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const pageVal = `${row[pagesColIdx] ?? ""}`.trim();
        const link = `${row[linkColIdx] ?? ""}`.trim();
        if ((pageVal === "*" || pageVal === "") && link.length > 0) {
            missingRows.push({
                rowIdx: r,
                title: `${row[titleColIdx] ?? ""}`,
                link,
                fileId: extractGoogleDriveId(link),
            });
        }
    }

    console.log(`findMissingPageCountAndRepopulate: ${missingRows.length}/${rows.length - 1} rows with missing page count in ${excelPath}`);

    const failures: { title: string; link: string; error: string }[] = [];
    let repopulatedCount = 0;
    const limit = pLimit(3);
    let processed = 0;

    await Promise.all(missingRows.map(item => limit(async () => {
        processed++;
        console.log(`Repopulating page count ${processed}/${missingRows.length} for ${item.title}...`);
        try {
            if (!item.fileId) {
                throw new Error(`Could not extract file id from link ${item.link}`);
            }
            const pageCount = await fetchPdfPageCountFromGDrive(item.fileId, drive, item.title);
            const cellRef = xlsx.utils.encode_cell({ r: item.rowIdx, c: pagesColIdx });
            sheet[cellRef] = { t: 'n', v: pageCount };
            repopulatedCount++;
            console.log(`Repopulated page count for ${item.title}: ${pageCount}`);
        } catch (err: any) {
            const error = err?.message || String(err);
            console.error(`Failed to repopulate page count for ${item.title}: ${error}`);
            failures.push({ title: item.title, link: item.link, error });
        }
    })));

    if (repopulatedCount > 0) {
        xlsx.writeFile(workbook, excelPath);
        console.log(`findMissingPageCountAndRepopulate: wrote ${repopulatedCount} page counts back to ${excelPath}`);
    }

    const stillFailingCount = missingRows.length - repopulatedCount;
    return {
        status: stillFailingCount === 0 ? "success" : (repopulatedCount > 0 ? "partial" : (missingRows.length === 0 ? "success" : "failed")),
        excelPath,
        totalDataRows: rows.length - 1,
        missingPageCountCount: missingRows.length,
        sampleTitlesOfMissing: missingRows.slice(0, MAX_SAMPLE_TITLES).map(x => x.title),
        repopulatedCount,
        stillFailingCount,
        summary: missingRows.length === 0 ?
            `No rows with missing page count ("*") found out of ${rows.length - 1} rows.` :
            `${missingRows.length} of ${rows.length - 1} rows had missing page count ("*"). Repopulated ${repopulatedCount}. Still failing: ${stillFailingCount}.`,
        failures: failures.slice(0, MAX_SAMPLE_TITLES),
    };
};
