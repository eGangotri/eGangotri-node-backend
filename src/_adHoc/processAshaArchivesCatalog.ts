import { parse } from 'csv-parse';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { stringify } from 'csv-stringify';
import { aksharamukhaIastToRomanColloquial } from '../aksharamukha/convert';
import { finished } from 'stream/promises';
import path from 'path';

const INPUT_FILE = "C:\\Users\\cheta\\OneDrive\\Documents\\Asa Kuthi\\0-Asha-Archives-Catalogs\\catalog_output.csv";
const OUTPUT_FILE = INPUT_FILE.replace('.csv', '-colloquial.csv');
const BATCH_SIZE = 10;

interface BatchItem {
    index: number;
    field: 'title' | 'subject';
    text: string;
}

async function processBatch(items: BatchItem[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const uniqueTexts = Array.from(new Set(items.map(item => item.text)));
    
    try {
        // Process each text sequentially to avoid overwhelming the API
        for (const text of uniqueTexts) {
            if (!text) continue; // Skip empty texts
            
            try {
                const result = await aksharamukhaIastToRomanColloquial(text);
                console.log(`Processed: /${text} -> ${result}`);
                results.set(text, result);
            } catch (error) {
                console.error(`Error processing text: ${text}`, error);
                results.set(text, text); // fallback to original text on error
            }
        }
    } catch (error) {
        console.error('Error in batch processing:', error);
    }

    return results;
}

async function processRecordBatch(records: any[]): Promise<any[]> {
    const batchItems: BatchItem[] = [];
    console.log(`Processing batch of ${JSON.stringify(records)}`)
    // Only collect title and subject fields, and only if they exist and are non-empty
    records.forEach((record, index) => {
        if (record.title && typeof record.title === 'string' && record.title.trim()) {
            batchItems.push({ index, field: 'title', text: record.title.trim() });
        }
        if (record.subject && typeof record.subject === 'string' && record.subject.trim()) {
            batchItems.push({ index, field: 'subject', text: record.subject.trim() });
        }
    });
    console.log(` batchItems of ${JSON.stringify(batchItems)}`)

    if (batchItems.length === 0) {
        return records;
    }

    console.log(`Processing batch of ${records.length} records (${batchItems.length} translations needed)`);
    const translationResults = await processBatch(batchItems);

    // Apply translations back to records, preserving all other fields unchanged
    const processedRecords = records.map(record => {
        const processed = { ...record };
        if (record.title && typeof record.title === 'string' && record.title.trim()) {
            processed['title-colloquial'] = translationResults.get(record.title.trim()) || record.title;
        }
        if (record.subject && typeof record.subject === 'string' && record.subject.trim()) {
            processed['subject-colloquial'] = translationResults.get(record.subject.trim()) || record.subject;
        }
        return processed;
    });

    return processedRecords;
}

async function processCSV() {
    try {
        // Check if input file exists
        if (!existsSync(INPUT_FILE)) {
            throw new Error(`Input file not found: ${INPUT_FILE}`);
        }

        console.log(`Starting CSV processing...\nInput: ${INPUT_FILE}\nOutput: ${OUTPUT_FILE}`);

        const records: any[] = [];
        const parser = createReadStream(INPUT_FILE)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            }));

        // Read all records first
        for await (const record of parser) {
            records.push(record);
        }

        console.log(`Read ${records.length} records. Processing in batches of ${BATCH_SIZE}...`);

        // Process records in batches
        const processedRecords: any[] = [];
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const processedBatch = await processRecordBatch(batch);
            processedRecords.push(...processedBatch);
            console.log(`Processed batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(records.length/BATCH_SIZE)}`);
        }

        console.log(`Processed all ${processedRecords.length} records. Writing to output file...`);

        // Ensure output directory exists
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!existsSync(outputDir)) {
            throw new Error(`Output directory does not exist: ${outputDir}`);
        }

        // Write the processed records to a new CSV
        return new Promise((resolve, reject) => {
            const writableStream = createWriteStream(OUTPUT_FILE);
            const stringifier = stringify({ header: true });

            writableStream.on('error', reject);
            writableStream.on('finish', () => {
                console.log(`Successfully wrote output to: ${OUTPUT_FILE}`);
                resolve(undefined);
            });

            stringifier.pipe(writableStream);

            for (const record of processedRecords) {
                stringifier.write(record);
            }
            stringifier.end();
        });
    } catch (error) {
        console.error('Error processing CSV:', error);
        throw error;
    }
}

processCSV().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
