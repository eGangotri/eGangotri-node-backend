import * as xlsx from 'xlsx';
import { GDriveExcelHeaders, GDriveExcelHeadersFileRenamerV2, GoogleApiData } from '../googleapi/types';
import { SHEET_NAME } from '../googleapi/_utils/constants';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as _ from 'lodash';
import * as XLSX from "xlsx";
import { formatMem, formatMemForHeapSizeInKB } from '../../imgToPdf/utils/Utils';
import { autoFitColumnsForAoa } from './SheetUtils';

export type ExcelWriteResult = {
  success?: boolean;
  success2?: boolean;
  msg?: string; msg2?: string;
  xlsxFileNameWithPath?: string
}

const NEW_HEADERS = [
  'Link to File Location',
  'Title in English ( No Diacritics )',
  'Author/Commentator',
  'Language(s)',
  'Script',
  'Subject/ Notes',
  'Result',
];

export function createManuExcelVersion(sourceExcelPath: string): ExcelWriteResult {
  try {
    const wb = xlsx.readFile(sourceExcelPath);
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows || rows.length === 0) {
      return { success: false, success2: false, msg: 'No rows found', xlsxFileNameWithPath: '' };
    }

    const startRemoveIdx = 3; // 0-based index for column D
    const endRemoveIdx = 22;  // 0-based index for column W

    const outRows: any[][] = [];
    for (let r = 0; r < rows.length; r++) {
      const row = Array.isArray(rows[r]) ? [...rows[r]] : [];

      // Remove columns D..W if present
      if (row.length > startRemoveIdx) {
        const deleteCount = Math.max(0, Math.min(endRemoveIdx, row.length - 1) - startRemoveIdx + 1);
        if (deleteCount > 0) row.splice(startRemoveIdx, deleteCount);
      }

      if (r === 0) {
        // Header row: enforce new headers for C..I
        // Ensure columns A,B exist
        if (row.length < 2) {
          while (row.length < 2) row.push('');
        }
        // Set C to 'Link to File Location'
        if (row.length >= 3) row[2] = NEW_HEADERS[0]; else row[2] = NEW_HEADERS[0];
        // Insert remaining headers after C
        row.splice(3, 0, ...NEW_HEADERS.slice(1));
      } else {
        // Data rows: preserve A,B,C (C should already be link column), insert blanks for new D..I
        if (row.length < 3) {
          while (row.length < 3) row.push('');
        }
        row.splice(3, 0, ...Array(NEW_HEADERS.length - 1).fill(''));
      }

      outRows.push(row);
    }

    const newWs = xlsx.utils.aoa_to_sheet(outRows);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, firstSheetName);
    xlsx.writeFile(newWb, sourceExcelPath);
    return { success2: true, msg2: `created Manuscript Version ${sourceExcelPath}` };
  } catch (err: any) {
    return { success2: false, msg2: err?.message || 'Failed to create manu-version excel' };
  }
}

export function createMimimalExcelVersion(sourceExcelPath: string): ExcelWriteResult {
  try {
    const wb = xlsx.readFile(sourceExcelPath);
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (!rows || rows.length === 0) {
      return { success: false, success2: false, msg: 'No rows found', msg2: 'No rows found', xlsxFileNameWithPath: '' };
    }

    const startRemoveIdx = 3; // 0-based index for column D
    const endRemoveIdx = 22;  // 0-based index for column W

    const outRows: any[][] = [];
    for (let r = 0; r < rows.length; r++) {
      const row = Array.isArray(rows[r]) ? [...rows[r]] : [];

      // Remove columns D..W if present
      if (row.length > startRemoveIdx) {
        const deleteCount = Math.max(0, Math.min(endRemoveIdx, row.length - 1) - startRemoveIdx + 1);
        if (deleteCount > 0) row.splice(startRemoveIdx, deleteCount);
      }
      outRows.push(row);
    }

    const newWs = xlsx.utils.aoa_to_sheet(outRows);
    const newWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWb, newWs, firstSheetName);
    xlsx.writeFile(newWb, sourceExcelPath);
    return { success2: true, msg2: `created Minimal Version ${sourceExcelPath}` };
  } catch (err: any) {
    return { success2: false, msg2: err?.message || 'Failed to create minimal version' };
  }
}

const convertDatatoJson = (googleDriveFileData: Array<GoogleApiData>) => {
  const jsonArray: GDriveExcelHeaders[] = []
  for (const dataRow of googleDriveFileData) {
    jsonArray.push({
      "S.No": dataRow.index,
      "Title in Google Drive": dataRow.fileName,
      "Link to File Location": dataRow.googleDriveLink,

      "Link to Truncated File Location": "*",
      "Book / Manuscript": "*",
      "Title in English": "*",
      "Title in Original Script ( Devanagari etc )": "*",
      "Sub-Title": "*",
      "Author": "*",
      "Commentator/ Translator/Editor": "*",
      "Language(s)": "*",
      "Script": "*",
      "Subject/ Descriptor": "*",
      "Publisher": "*",
      "Edition/Statement": "*",
      "Place of Publication": "*",
      "Year of Publication": "*",
      "No. of Pages": "*",
      "ISBN": "*",
      "Remarks": "*",
      "Commentairies": "*",
      "Commentator": "*",
      "Series ( KSTS/Kavyamala/Chowkhamba etc": "*",

      "Size with Units": dataRow.sizeInfo,
      "Size in Bytes": dataRow.fileSizeRaw,
      "Folder Name": dataRow.parents,
      "Thumbnail": dataRow.thumbnailLink,
      "Created Time": dataRow.createdTime,
    })
  }
  return jsonArray
}

const compositeTitleFormula = (idx: number) => {
  const formula = `=D${idx} & " " & E${idx} & IF(J${idx} <> "", " by " & F${idx},  "") & " " & G${idx} & " " & H${idx} & " " & I${idx} & " " & K${idx} & " " & L${idx} & " " & M${idx} & IF(J${idx} <> "", " - " & J${idx}, "")`
  //=D2 & " " & E2 & IF(J2 <> "", " by " & F2,  "") & " " & G2 & " " & H2 & " " & I2 & " " & K2 & " " & L2 & " " & M2 & IF(J2 <> "", " - " & J2, "")
  return idx && idx > 1 ? formula : ""
}

const origNameFormula = (idx: number) => {
  const formula = `=REGEXREPLACE(B${idx}, "_\\d+(\\.[a-zA-Z]+)$", "$1")`
  //=REGEXREPLACE(B2, "_\d+(\.[a-zA-Z]+)$", "$1")
  return idx && idx > 1 ? formula : ""

}
const convertFileRenamerV2DatatoJson = (googleDriveFileData: Array<GoogleApiData>) => {
  const jsonArray: GDriveExcelHeadersFileRenamerV2[] = []
  let idx = 1;
  for (const dataRow of googleDriveFileData) {
    jsonArray.push({
      "S.No": dataRow.index,
      "Title in Google Drive": dataRow.fileName,
      "Link to File Location": dataRow.googleDriveLink,
      "Title in English": "",
      "Sub-Title": "",
      "Author": "",
      "Commentator/ Translator/Editor": "",
      "Language(s)": "",
      "Subject/ Descriptor": "",
      "Publisher": "",
      "Edition/Statement": "",
      "Place of Publication": "",
      "Year of Publication": "",
      "Composite Title": compositeTitleFormula(idx + 1),
      "Orig Name": origNameFormula(idx + 1),
      "Folder Name": dataRow.parents,
      "Thumbnail": dataRow.thumbnailLink,
    })
    idx++;
  }
  return jsonArray
}


export const jsonDataToXslx = async (googleDriveFileData: Array<GoogleApiData>, xlsxFilePath: string): Promise<ExcelWriteResult | null> => {
  try {
    const jsonArray: GDriveExcelHeaders[] = convertDatatoJson(googleDriveFileData);
    const result = jsonToExcel(jsonArray, xlsxFilePath)
    return result
  } catch (error) {
    console.error('An error occurred:', error);
    return null
  }
}

export const jsonDataToXslxFileRenamerV2 = async (googleDriveFileData: Array<GoogleApiData>, xlsxFilePath: string): Promise<ExcelWriteResult | null> => {
  try {
    const jsonArray: GDriveExcelHeadersFileRenamerV2[] = convertFileRenamerV2DatatoJson(googleDriveFileData);
    const result = jsonToExcel(jsonArray, xlsxFilePath)
    return result
  } catch (error) {
    console.error('An error occurred:', error);
    return null
  }
}


export const jsonToExcel = (jsonArray: any[], xlsxFileNameWithPath: string): ExcelWriteResult => {

  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // Convert JSON to worksheet
  const worksheet = xlsx.utils.json_to_sheet(jsonArray);

  // Add the worksheet to the workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, SHEET_NAME);

  // Write the workbook to a file
  xlsx.writeFile(workbook, xlsxFileNameWithPath);
  console.log(`created ${xlsxFileNameWithPath}`)
  return {
    success: true,
    msg: `created ${xlsxFileNameWithPath}`,
    xlsxFileNameWithPath
  }
}



export const jsonToExcelWithFormula = (jsonArray: any[], xlsxFileNameWithPath: string): ExcelWriteResult => {

  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // Convert JSON to worksheet
  const worksheet: xlsx.WorkSheet = xlsx.utils.json_to_sheet(jsonArray);
  jsonArray.forEach((row, index) => {
    if (index === 0) return;
    else {
      const oneBasedIndex = index + 1;
      console.log(`oneBasedIndex ${oneBasedIndex}`)
      //   worksheet.getCell('O2').value = { formula: 'B2+C2' };
      // worksheet.getCell(`O${oneBasedIndex}`).value = {
      //   formula: `D${oneBasedIndex} & " " & E${oneBasedIndex} & IF(J${oneBasedIndex} <> "", " by " & F${oneBasedIndex},  "") & " " & G${oneBasedIndex} & " " & H${oneBasedIndex} & " " & I${oneBasedIndex} & " " & K${oneBasedIndex} & " " & L${oneBasedIndex} & " " & M${oneBasedIndex} & IF(J${oneBasedIndex} <> "", " - " & J${oneBasedIndex}, "")`
      // };
      // worksheet.getCell(`P${oneBasedIndex}`).value = { formula: `REGEXREPLACE(B${oneBasedIndex}, "_\\d+(\\.[a-zA-Z]+)$", "$1")` };
    }
  });

  // Add the worksheet to the workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, SHEET_NAME);

  // Write the workbook to a file
  xlsx.writeFile(workbook, xlsxFileNameWithPath);
  console.log(`created ${xlsxFileNameWithPath}`)
  return {
    success: true,
    msg: `created ${xlsxFileNameWithPath}`,
    xlsxFileNameWithPath
  }
}

async function editExistingExcelSheet(excelSheetPath: string) {
  // Load the existing workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelSheetPath);

  // Select the worksheet you want to edit (assuming it's the first sheet)
  const sheet = workbook.getWorksheet(1);
  const rowFirst = sheet.getRow(1);
  rowFirst.actualCellCount

  const rowArray: string[] = []
  const range = _.range(0, rowFirst.actualCellCount - 1);
  range.forEach((row) => rowArray.push(" "))
  // Insert new rows
  // sheet.addRow(['eGangotri Open Access Catalog Fields for Text Cataloging',...rowArray]);
  // sheet.addRow(['',...rowArray]);

  // Change the font for the newly inserted rows
  const fontForHeader: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 14,
    bold: true,
    color: { argb: 'BLACK' } // Red color (ARGB format)
  };

  const commonFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    color: { argb: 'BLACK' } // Red color (ARGB format)
  };

  sheet.getCell(`A1`).font = fontForHeader;
  const desiredWidth = 100;

  // Iterate through cells in row 3 and set the width
  const row = sheet.getRow(3);
  row.eachCell((cell) => {
    const column = sheet.getColumn(cell.col);
    column.width = desiredWidth;
  });


  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    // Apply the font settings to each cell in the row
    row.eachCell((cell) => {
      cell.font = commonFont;
    });
  }

  const parentDirname = path.dirname(excelSheetPath);
  const newFileName = path.parse(excelSheetPath).name

  await workbook.xlsx.writeFile(`${parentDirname}\\1-${newFileName}.xlsx`);
}

export const excelToJsonFor2RowAsHeader = (filePath: string, sheetName: string): any[] => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) {
    throw new Error('The sheet does not have enough rows.');
  }

  const headers = rows[1] as string[]; // Use the second row as headers
  const data = rows.slice(2); // Skip the first two rows

  return data.map(row => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      if (header !== undefined && row[index] !== undefined) {
        obj[header] = row[index];
      }
    });
    return obj;
  });
};
export const excelToJson = (excelName: string, sheetName: string = SHEET_NAME) => {
  const workbook = XLSX.readFile(excelName);
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  // defval ensures empty cells are included, so all header columns are present on each row
  const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const cols = Object.keys(jsonData[0])
  const colCount = cols.length;
  console.log(`cols: ${cols}`)
  console.log(`excelToJson:Converted ${excelName} to Json with Col Count ${colCount} and Data Length ${jsonData.length}(figure may include empty rows)`);
  return jsonData
}

export function excelToJsonV2<T>(excelName: string): T[] {
  const workbook = XLSX.readFile(excelName);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData: T[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`Converted ${excelName} to Json with Data Length ${jsonData.length}(figure may include empty rows)`);
  return jsonData
}


export function getGoogleDriveId(link: string): string {
  // Regular expression to match Google Drive link ID
  const regex = /\/d\/(.*?)\//;
  const match = link.match(regex);
  console.log(`${link}\nmatch ? match[1] : "" ->${match ? match[1] : ""}<-`)
  return match ? match[1] : "";
}


export function addFolderMetadataSheet(excelPath: string): { success: boolean; message: string; totalFolders: number } {
  try {
    const wb = xlsx.readFile(excelPath);
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];

    const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (!rows || rows.length === 0) {
      return { success: false, message: 'No rows found', totalFolders: 0 };
    }

    const agg: Record<string, { count: number; sumD: number; sumG: number }> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const folderNameRaw = row[2];
      if (folderNameRaw === null || folderNameRaw === undefined || `${folderNameRaw}`.trim() === '') continue;
      const folderName = `${folderNameRaw}`.trim();

      const dValRaw = row[3];
      const gValRaw = row[6];
      const dVal = typeof dValRaw === 'number' ? dValRaw : parseFloat(`${dValRaw}`.replace(/,/g, ''));
      const gVal = typeof gValRaw === 'number' ? gValRaw : parseFloat(`${gValRaw}`.replace(/,/g, ''));
      const dNum = isNaN(dVal) ? 0 : dVal;
      const gNum = isNaN(gVal) ? 0 : gVal;

      if (!agg[folderName]) agg[folderName] = { count: 0, sumD: 0, sumG: 0 };
      agg[folderName].count += 1;
      agg[folderName].sumD += dNum;
      agg[folderName].sumG += gNum;
    }

    const header = ['Folder Name', 'Total Pdf Count', 'Total Page Count', 'Total Size', 'Total Size in KB'];
    const aoa: any[][] = [header];
    const keys = Object.keys(agg).sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      const sizeInKB = agg[key].sumG;
      const inGB = formatMemForHeapSizeInKB(sizeInKB)
      aoa.push([key, agg[key].count, agg[key].sumD, inGB, sizeInKB]);
    }

    // Add an empty row followed by totals
    aoa.push([]);
    const totalPdfCount = keys.reduce((acc, k) => acc + agg[k].count, 0);
    const totalPageCount = keys.reduce((acc, k) => acc + agg[k].sumD, 0);
    const totalSizeInKB = keys.reduce((acc, k) => acc + agg[k].sumG, 0);
    const totalSizeFormatted = formatMemForHeapSizeInKB(totalSizeInKB);
    aoa.push(['Totals', totalPdfCount, totalPageCount, totalSizeFormatted, totalSizeInKB]);


    const metadataWs = xlsx.utils.aoa_to_sheet(aoa);
    metadataWs['!cols'] = autoFitColumnsForAoa(aoa, { min: 10, max: 80, pad: 2 });
    const metadataSheetName = 'Metadata';
    wb.Sheets[metadataSheetName] = metadataWs;
    if (!wb.SheetNames.includes(metadataSheetName)) wb.SheetNames.push(metadataSheetName);

    xlsx.writeFile(wb, excelPath);
    return { success: true, message: `Metadata written`, totalFolders: keys.length };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to write Metadata', totalFolders: 0 };
  }
}
