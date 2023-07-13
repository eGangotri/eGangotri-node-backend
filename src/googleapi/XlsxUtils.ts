import * as fs from 'fs';
import * as xlsx from 'xlsx';

export const dataToXslx = async (googleDrivePdfData: Array<Array<string|number>>, xlsxFilePath: string) => {
  try {
    const jsonArray = [{}]
    for(const dataRow of googleDrivePdfData){
        let x = 0
        jsonArray.push({
            "S.No":dataRow[x++],
            "Title in Google Drive":dataRow[x++],
            "Link to File Location":dataRow[x++],
            "Size with Units":dataRow[x++],
            "Size in Bytes":dataRow[x++],
            "Folder Name":dataRow[x++],
        })
    }

    console.log(`jsonArray ${JSON.stringify(jsonArray[1])}`)
    console.log(`jsonArray ${JSON.stringify(jsonArray[2])}`)
    // Create a new workbook
    const workbook = xlsx.utils.book_new();

    // Convert JSON to worksheet
    const worksheet = xlsx.utils.json_to_sheet(jsonArray);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    // Write the workbook to a file
    xlsx.writeFile(workbook, xlsxFilePath);

    console.log(`Written to ${xlsxFilePath}!`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

//const fileNameWithPath = `C:\\Users\\chetan\\Treasures-59\\csv-ggl-drv-1pxxhV2BkyTZgq34InhTuwDh-szU0jvY4-Treasures-59-14-Jul-2023`;
const fileNameWithPath = "C:\\Users\\chetan\\Treasures-59\\1"
//convertCsvToXlsx(`${fileNameWithPath}.csv`,`${fileNameWithPath}.xlsx`);
