import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createObjectCsvWriter } from 'csv-writer';

const execAsync = promisify(exec);

const _basePath = "C:\\Users\\cheta\\OneDrive\\Documents\\Asa Kuthi\\0-Asha-Archives-Catalogs\\"
const pdfPath = `${_basePath}ASK Catalog complete optimized.pdf`

const csvWriter = createObjectCsvWriter({
  path: `${_basePath}output.csv`,
  header: [
    { id: 'dp_no', title: 'dp_no' },
    { id: 'roman_title', title: 'roman_title' },
    { id: 'language', title: 'language' },
    { id: 'script', title: 'script' },
    { id: 'material', title: 'material' }
  ]
});

interface CatalogEntry {
  dp_no: string;
  roman_title: string;
  language: string;
  script: string;
  material: string;
}

function parseEntries(text: string): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  console.log('Number of lines in text:', text.split('\n').length);
  const lines = text.split('\n').map(l => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dpMatch = line.match(/^(\d{4})$/);
    if (dpMatch) {
      const dp_no = dpMatch[1];
      let roman_title = '';
      let language = '';
      let script = '';
      let material = '';

      // Title might span multiple lines
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^(Skt|Newa:|Skt\.-Newa:)/)) {
        roman_title += (roman_title ? ' ' : '') + lines[j];
        j++;
      }

      // Language + Script line
      const langLine = lines[j] || '';
      const langScriptMatch = langLine.match(/^(Skt(?:\.-Newa:)?|Newa:)(?:\s*[\.,]?\s*)?(Newa:|Dng\.?|Rnj\.?)?/);
      if (langScriptMatch) {
        language = langScriptMatch[1].replace(/[:\.]+$/, '');
        script = langScriptMatch[2]?.replace(/[:\.]+$/, '') || '';
        j++;
      }

      // Material line (Paper, H. on ...)
      const matLine = lines[j] || '';
      const matMatch = matLine.match(/Paper.*?(H\. on.*)?/);
      if (matMatch) {
        material = 'Paper' + (matMatch[1] ? `, ${matMatch[1]}` : '');
      }

      entries.push({
        dp_no,
        roman_title: roman_title.trim().replace(/\s+/g, ' '),
        language,
        script,
        material
      });

      i = j;
    }
  }

  return entries;
}

async function run() {
  // Extract text using pdftotext with UTF-8 encoding and layout preservation
  const outputPath = pdfPath.replace('.pdf', '.txt');
  try {
    // Use -layout to preserve the original physical layout
    await execAsync(`pdftotext -layout -enc UTF-8 "${pdfPath}" "${outputPath}"`);
    const extractedText = fs.readFileSync(outputPath, 'utf8');
    
    // Debug: Show the first 500 characters of extracted text
    console.log('First 500 chars of extracted text:', extractedText.slice(0, 500));
    const entries = parseEntries(extractedText);
    
    // Clean up the temporary text file
    fs.unlinkSync(outputPath);
    
    console.log(entries);
    await csvWriter.writeRecords(entries);
    console.log(`✅ CSV file generated with ${entries.length} entries.`);
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

run().catch(err => {
  console.error('Error:', err);
});
