import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { ArchiveItem } from '../models/ArchiveItem';
import { ArchiveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeys } from './utils';

const excelToMongo = (pathToExcel:string) => {
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const newData = replaceExcelHeadersWithJsonKeys(data, ArchiveExcelHeaderToJSONMAPPING)
    console.log(`started inserting newData (${newData?.length}) into mongo`);

    connectToMongo(["forUpload"]).then(async () => {
        // Prepare operations for bulkWrite
        const operations = newData.map(document => ({
            insertOne: {
                document
            }
        }));

        return ArchiveItem.bulkWrite(operations, { ordered: false })
            .then(res => {
                printMongoTransactions(res)
            })
            .catch((err) => {
                if (err.code === 11000) { // Duplicate key error code
                    console.log('Some documents were not inserted due to duplicate keys');
                    printMongoTransactions(err.result, true);
                } else {
                    console.error(`err bulkWrite ArchiveItem ${err}`);
                }
            });
    });
}

excelToMongo("C:\\Users\\chetan\\Downloads\\" + "upss_manuscripts(161)-08-Apr-2024" + ".xlsx");
//process.exit(0);
// yarn run excelToMongoArchive