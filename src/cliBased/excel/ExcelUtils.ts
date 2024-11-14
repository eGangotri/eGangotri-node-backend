import * as xlsx from 'xlsx';
import { GDriveExcelHeaders, GDriveExcelHeadersFileRenamerV2, GoogleApiData } from '../googleapi/types';
import { SHEET_NAME } from '../googleapi/_utils/constants';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as _ from 'lodash';
import * as XLSX from "xlsx";
import { title } from 'process';

const setHeadersForExcel = () => {
  const headerArray = [
    "S.No", "Title in Google Drive", "Link to File Location",
    "Title	in English", "Title in Original Script ( Devanagari etc )",
    "Sub-Title", "Author",
    "Commentator/ Translator/Editor", "Language(s)", "Script", "Subject/ Descriptor", "Publisher", "Edition",
    "Statement", "Place of Publication", "Year of Publication", "No. of Pages", "ISBN", "Remarks",
    "Size with Units", "Size in Bytes", "Folder Name"
  ]
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

const compositeTitleFormula = (idx:number) =>{
  const formula = `=D${idx} & " " & E${idx} & IF(J${idx} <> "", " by " & F${idx},  "") & " " & G${idx} & " " & H${idx} & " " & I${idx} & " " & K${idx} & " " & L${idx} & " " & M${idx} & IF(J${idx} <> "", " - " & J${idx}, "")`
//=D2 & " " & E2 & IF(J2 <> "", " by " & F2,  "") & " " & G2 & " " & H2 & " " & I2 & " " & K2 & " " & L2 & " " & M2 & IF(J2 <> "", " - " & J2, "")
  return idx && idx > 1 ? formula :""
}

const origNameFormula = (idx:number) =>{
  const formula = `=REGEXREPLACE(B${idx}, "_\\d+(\\.[a-zA-Z]+)$", "$1")`
  //=REGEXREPLACE(B2, "_\d+(\.[a-zA-Z]+)$", "$1")
  return idx && idx > 1 ? formula :""

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
      "Composite Title": compositeTitleFormula(idx+1),
      "Orig Name": origNameFormula(idx+1),
      "Folder Name": dataRow.parents,
      "Thumbnail": dataRow.thumbnailLink,
    })
    idx++;
  }
  return jsonArray
}


export const jsonDataToXslx = async (googleDriveFileData: Array<GoogleApiData>, xlsxFilePath: string) => {
  try {
    const jsonArray: GDriveExcelHeaders[] = convertDatatoJson(googleDriveFileData);
    jsonToExcel(jsonArray, xlsxFilePath)

    console.log(`Excel File Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

export const jsonDataToXslxFileRenamerV2 = async (googleDriveFileData: Array<GoogleApiData>, xlsxFilePath: string) => {
  try {
    const jsonArray: GDriveExcelHeadersFileRenamerV2[] = convertFileRenamerV2DatatoJson(googleDriveFileData);
    jsonToExcel(jsonArray, xlsxFilePath)

    console.log(`Excel File Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}


export const jsonToExcel = (jsonArray: any[], xlsxFileNameWithPath: string) => {

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



export const jsonToExcelWithFormula = (jsonArray: any[], xlsxFileNameWithPath: string) => {

  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // Convert JSON to worksheet
  const worksheet:xlsx.WorkSheet = xlsx.utils.json_to_sheet(jsonArray);
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
  const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
  console.log(`Converted ${excelName} to Json with Data Length ${jsonData.length}(figure may include empty rows)`);
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

