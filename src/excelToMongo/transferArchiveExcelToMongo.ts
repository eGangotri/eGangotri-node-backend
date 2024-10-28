import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { ArchiveItem } from '../models/ArchiveItem';
import { ArchiveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeysForArchiveItem } from './utils';
import fs from 'fs/promises';
import path from 'path';
import os from "os";

const transformExcelToJSON = async (pathToExcel: string, source: string) => {
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const newData = replaceExcelHeadersWithJsonKeysForArchiveItem(data, ArchiveExcelHeaderToJSONMAPPING, source)
    console.log(`started inserting newData (${newData?.length}) into mongo`);
    return newData;
}

async function excelJsonToMongo(newData: {}[]) {
    try {
        // Prepare operations for bulkWrite
        const operations = newData.map(document => ({
            insertOne: {
                document
            }
        }));

        try {
            const res = await ArchiveItem.bulkWrite(operations, { ordered: false });
            printMongoTransactions(res);
        } catch (err) {
            if (err.code === 11000) { // Duplicate key error code
                console.log('Some documents were not inserted due to duplicate keys');
                printMongoTransactions(err.result, true);
            } else {
                console.error(`err bulkWrite ArchiveItem ${err}`);
            }
        }
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}


export async function archiveExceltoMongo(directoryPath: string) {
    await connectToMongo(["forUpload"]);
    try {
        const files = await fs.readdir(directoryPath);
        const rootFolder = path.basename(directoryPath);
        
        for (const file of files) {
            if (path.extname(file) === '.xlsx') {
                const filePath = path.join(directoryPath, file)
                console.log(` processing ${rootFolder} : ${path.join(directoryPath, file)}`);
                const newData = await transformExcelToJSON(filePath, rootFolder)
                await excelJsonToMongo(newData);
            }
        }
    } catch (err) {
        console.error('Unable to scan directory: ' + err);
    }
    console.log(` excel to mongo for  ${directoryPath}`);

}

export async function deleteRowsByAccts(accts: string[]) {
    try {
        connectToMongo(["forUpload"]).then(async () => {
            const result = await ArchiveItem.deleteMany({ acct: { $in: accts } });
            console.log(`${result?.deletedCount} document(s) were deleted.`);
            printMongoTransactions(result);

        });
    } catch (err) {
        printMongoTransactions(err.result, true);
        console.error('Error occurred while deleting documents: ', err);
    }
}

//deleteRowsByAccts(['drnaithaniX', 'lucknow_state_museumXXX'] );
const homeDirectory = os.homedir();
//archiveExceltoMongo(`${homeDirectory}\\Desktop\\archiveExcels\\Varanasi`);
// pnpm run excelToMongoArchive