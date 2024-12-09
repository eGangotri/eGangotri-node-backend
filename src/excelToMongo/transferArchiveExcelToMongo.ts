import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { ArchiveItem } from '../models/ArchiveItem';
import { ArchiveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeysForArchiveItem } from './utils';
import fs from 'fs/promises';
import path from 'path';
import os from "os";
import { getCountArchiveItems } from '../services/archiveItemService';

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

/**
 * 
 * @param directoryPathOrExcel Single Excel or Directory containing multiple Excels
 * @returns 
 */
export async function archiveExceltoMongo(directoryPathOrExcel: string, source: string = "") {
    await connectToMongo(["forUpload"]);
    try {
        if (directoryPathOrExcel.endsWith(".xlsx")) {
            const newData = await transformExcelToJSON(directoryPathOrExcel, source);
            await excelJsonToMongo(newData);
            const { count, acct } = await archiveExcelToMongoCheckReport(newData);
            return {
                success: count > 0,
                msg: `Excel Path ${directoryPathOrExcel} read to insert ${count} items in acct ${acct}`,
            }
        }
        else {
            const files = await fs.readdir(directoryPathOrExcel);
            const rootFolderAsSource = path.basename(directoryPathOrExcel);
            const resultMap = []
            let excelCount = 0;
            for (const file of files) {
                if (path.extname(file) === '.xlsx') {
                    excelCount++;
                    const filePath = path.join(directoryPathOrExcel, file)
                    console.log(` processing ${rootFolderAsSource} : ${path.join(directoryPathOrExcel, file)}`);
                    const newData = await transformExcelToJSON(filePath, rootFolderAsSource)
                    await excelJsonToMongo(newData);
                    resultMap.push(await archiveExcelToMongoCheckReport(newData));
                }
            }
            return {
                success: excelCount === resultMap.length,
                msg: `Excel Path ${directoryPathOrExcel} read for ${excelCount} excels 
                and inserted ${resultMap.length} archiveDB Entries.
                `,
                resultMap: `${resultMap.forEach((x: any) => {
                    return JSON.stringify(x)
                })} `
            }
        }
    } catch (err) {
        console.error('Unable to scan directory: ' + err);
        return {
            error: 'Unable to scan directory: ' + JSON.stringify(err),
            success: false
        }
    }

}

async function archiveExcelToMongoCheckReport(newData: {}[]) {
    const acct = (newData && newData?.length > 0) ? newData[0]?.["acct"] : "";
    const count = await getCountArchiveItems({ acct });
    return {
        count,
        acct
    }
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