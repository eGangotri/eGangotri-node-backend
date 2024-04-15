import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { ArchiveItem } from '../models/ArchiveItem';
import { ArchiveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeysForArchiveItem } from './utils';
import fs from 'fs/promises';
import path from 'path';

const excelToMongo = (pathToExcel:string, source:string) => {
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const newData = replaceExcelHeadersWithJsonKeysForArchiveItem(data, ArchiveExcelHeaderToJSONMAPPING, source)
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

async function printXlsxFilePaths(directoryPath:string) {
    try {
        const files = await fs.readdir(directoryPath);

        for (const file of files) {
            if (path.extname(file) === '.xlsx') {
                const filePath = path.join(directoryPath, file)
                console.log(path.join(directoryPath, file));
                excelToMongo(filePath, "Official")
            }
        }
    } catch (err) {
        console.error('Unable to scan directory: ' + err);
    }
}
printXlsxFilePaths("C:\\Users\\chetan\\Desktop\\archiveExcels");
// yarn run excelToMongoArchive