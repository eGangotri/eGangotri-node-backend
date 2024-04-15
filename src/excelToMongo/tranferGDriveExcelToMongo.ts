import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { GoogleDriveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeysForGDriveItem } from './utils';
import { GDriveItem } from '../models/GDriveItem';

const googleListingExcelToMongo = (pathToExcel: string, source: string) => {
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const newData = replaceExcelHeadersWithJsonKeysForGDriveItem(data, GoogleDriveExcelHeaderToJSONMAPPING, source);
    console.log(`started inserting newData (${newData?.length}) into mongo 
    ${JSON.stringify(newData[0])}`);

    connectToMongo(["forUpload"]).then(async () => {
        // Prepare operations for bulkWrite
        const operations = newData.map(document => ({
            insertOne: {
                document
            }
        }));

        try {
            const res = await GDriveItem.bulkWrite(operations, { ordered: false });
            console.log("after bulkWrite");
            printMongoTransactions(res);
        } catch (err) {
            if (err.code === 11000) { // Duplicate key error code
                console.log('Some documents were not inserted due to duplicate keys');
                printMongoTransactions(err.result, true);
            } else {
                console.error(`err bulkWrite ArchiveItem ${err}`);
            }
        }
    });
}
googleListingExcelToMongo("C:\\_catalogWork\\_collation\\" +
    "Treasures-1G6A8zbbiLHFlqgNnPosq1q6JbOoI2dI--07-Aug-2023-23-09_2674-Catalog-14-Apr-2024-09-52-2674.xlsx",
    "Treasures-60"
);

// "C:\\_catalogWork\\_collation\\_catCombinedExcels\\Treasures 60\\" + "Treasures 60-Catalog-24-Aug-2023-01-22-1694" + ".xlsx");
//process.exit(0);
// yarn run excelToMongoGDrive 
