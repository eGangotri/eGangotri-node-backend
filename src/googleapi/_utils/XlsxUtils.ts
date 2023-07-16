import * as xlsx from 'xlsx';
import { ExcelHeaders } from './types';
import { SHEET_NAME } from './constants';

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

const convertDatatoJson = (googleDrivePdfData: Array<Array<any>>) => {
  const jsonArray: ExcelHeaders[] = []
  for (const dataRow of googleDrivePdfData) {
    let x = 0
    jsonArray.push({
      "S.No": dataRow[x++],
      "Title in Google Drive": dataRow[x++],
      "Link to File Location": dataRow[x++],

      "Link to Truncated File Location": "*",
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

      "Size with Units": dataRow[x++],
      "Size in Bytes": dataRow[x++],
      "Folder Name": dataRow[x++],
    })
  }
  return jsonArray
}
export const dataToXslx = async (googleDrivePdfData: Array<Array<string | number>>, xlsxFilePath: string) => {
  try {
    const jsonArray: ExcelHeaders[] = convertDatatoJson(googleDrivePdfData);
    jsonToExcel(jsonArray, xlsxFilePath)

    console.log(`Excel File Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

export const jsonToExcel = (jsonArray: ExcelHeaders[], xlsxFilePath: string) => {

  // Create a new workbook
  const workbook = xlsx.utils.book_new();

  // Convert JSON to worksheet
  const worksheet = xlsx.utils.json_to_sheet(jsonArray);

  // Add the worksheet to the workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, SHEET_NAME);

  // Write the workbook to a file
  xlsx.writeFile(workbook, xlsxFilePath);
}
