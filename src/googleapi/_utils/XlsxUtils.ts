import * as fs from 'fs';
import * as xlsx from 'xlsx';

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

const convertDatatoJson = (googleDrivePdfData: Array<Array<string | number>>) => {
  const jsonArray = [{}]
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

      "Size with Units": dataRow[x++],
      "Size in Bytes": dataRow[x++],
      "Folder Name": dataRow[x++],
    })
  }
  return jsonArray
}
export const dataToXslx = async (googleDrivePdfData: Array<Array<string | number>>, xlsxFilePath: string) => {
  try {
    const jsonArray = convertDatatoJson(googleDrivePdfData);
    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Convert JSON to worksheet
    const worksheet = xlsx.utils.json_to_sheet(jsonArray);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    // Write the workbook to a file
    xlsx.writeFile(workbook, xlsxFilePath);

    console.log(`Excel File Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};
