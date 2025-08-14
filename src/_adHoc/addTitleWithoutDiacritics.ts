import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import { aksharamukhaIastToRomanColloquial } from '../aksharamukha/convert';

async function addTitleWithoutDiacritics() {
    const inputPath = "C:\\Users\\cheta\\OneDrive\\Documents\\Asa Kuthi\\0-Asha-Archives-Catalogs\\updated_parsed_catalog.csv";
    const records = parse(fs.readFileSync(inputPath), {
        columns: true,
        skip_empty_lines: true
    });

    // Process each record to add the new column
    const processedRecords = await Promise.all(records.map(async (record: any) => {
        const titleWithoutDiacritics = await aksharamukhaIastToRomanColloquial(record.title || '');
        return {
            ...record,
            title_without_diacritics: titleWithoutDiacritics
        };
    }));

    // Show first 10 records
    console.log("First 10 records with new column:");
    console.table(processedRecords.slice(0, 10).map(record => ({
        title: record.title,
        title_without_diacritics: record.title_without_diacritics
    })));

    // Write back to CSV
    const output = stringify(processedRecords, { header: true });
    const outputPath = inputPath.replace('.csv', '_with_roman.csv');
    fs.writeFileSync(outputPath, output);
    console.log(`\nProcessed CSV saved to: ${outputPath}`);
}

addTitleWithoutDiacritics().catch(console.error);
