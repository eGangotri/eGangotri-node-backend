import * as xlsx from 'xlsx';
import { ExcelHeaders, GoogleApiData } from '../googleapi/types';
import { SHEET_NAME } from '../googleapi/_utils/constants';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as _ from 'lodash';
import * as XLSX from "xlsx";

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

const convertDatatoJson = (googleDrivePdfData:  Array<GoogleApiData>) => {
  const jsonArray: ExcelHeaders[] = []
  for (const dataRow of googleDrivePdfData) {
    let x = 0
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
export const dataToXslx = async (googleDrivePdfData: Array<GoogleApiData>, xlsxFilePath: string) => {
  try {
    const jsonArray: ExcelHeaders[] = convertDatatoJson(googleDrivePdfData);
    jsonToExcel(jsonArray, xlsxFilePath)

    console.log(`Excel File Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

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
}


async function editExistingExcelSheet(excelSheetPath:string) {
  // Load the existing workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelSheetPath);

  // Select the worksheet you want to edit (assuming it's the first sheet)
  const sheet = workbook.getWorksheet(1);
  const rowFirst = sheet.getRow(1);
  rowFirst.actualCellCount

  const rowArray:string[] = []
  const range = _.range(0, rowFirst.actualCellCount-1);
  range.forEach((row)=>rowArray.push(" "))
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
  const newFileName =  path.parse(excelSheetPath).name

  await workbook.xlsx.writeFile(`${parentDirname}\\1-${newFileName}.xlsx`);
}


export const excelToJson = (excelName: string, sheetName:string = SHEET_NAME) => {
  const workbook = XLSX.readFile(excelName);
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  const jsonData:any[] = XLSX.utils.sheet_to_json(sheet);
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

