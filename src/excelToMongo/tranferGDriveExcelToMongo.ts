import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../services/dbService';
import { GoogleDriveExcelHeaderToJSONMAPPING, printMongoTransactions, replaceExcelHeadersWithJsonKeysForGDriveItem } from './utils';
import { GDriveItem } from '../models/GDriveItem';
import path from 'path';
import { getLatestExcelFile } from '../utils/utils';

const transformExcelToJSON = async (pathToExcel: string, source: string) => {
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const newData = replaceExcelHeadersWithJsonKeysForGDriveItem(data, GoogleDriveExcelHeaderToJSONMAPPING, source);
    console.log(`transformExcelToJSON (${newData?.length}) items  ${JSON.stringify(newData[0])}`);
    return newData;
}

async function excelJsonToMongo(newData: {}[]) {
    const operations = newData.map((document, index) => {
            // const expectedFields = ['serialNo', 'titleGDrive', 'gDriveLink',
            // 'truncFileLink','sizeWithUnits','sizeInBytes','folderName','createdTime','source','identifier',
            // 'identifierTruncFile'

            // ]; // Replace with your actual field names

        // Add your validation checks here. For example:
        // const missingFields = expectedFields.filter(field => !(field in document));

        // if (missingFields.length > 0) {
        //     console.error(`Document at index ${index} is missing the following fields: ${missingFields.join(', ')}`);
        //     console.error('Document:', JSON.stringify(document, null, 2));
        //     return null;
        // }
        // if (!document['requiredField']) {
        //     console.error(`Document at index ${index} is missing requiredField:`, JSON.stringify(document, null, 2));
        //     return null;
        // }
        return {
            insertOne: {
                document
            }
        }
    });
   // console.log(JSON.stringify(operations, null, 2));
    try {
        const res = await GDriveItem.bulkWrite(operations, { ordered: false });
        console.log("after bulkWrite");
        console.log('Result:', res); // Log result
        const results = printMongoTransactions(res);
        return {
            ...results,
            success: true,

        }
    }
    catch (err) {
        console.log('Error Code:', err?.code); // Log error
        if (err.code === 11000) { // Duplicate key error code
            console.log('Some documents were not inserted due to duplicate keys');
            const results = printMongoTransactions(err.result, true);
            return {
                ...results,
                success: false,
                err: `err.code 110001` + err
            }
        } else {
            console.error(`err bulkWrite GDriveItem ${err}`); return {
                success: false,
                err: err
            }
        }
    }
}

export async function gDriveExceltoMongo(directoryPath: string) {
    let results = {};
    try {
        const { latestFilePath: gDriveExcel, latestFileName } = getLatestExcelFile(directoryPath)

        await connectToMongo(["forUpload"]);
        if (path.extname(gDriveExcel) === '.xlsx') {
            const rootFolder = path.basename(directoryPath);
            console.log(` processing ${rootFolder} for ${gDriveExcel}`);
            const newData = await transformExcelToJSON(gDriveExcel, rootFolder)
            results = await excelJsonToMongo(newData);
            return {
                ...results,
                msg: `excel (${latestFileName}) to mongo completed for ${rootFolder}`,
                directoryPath: `${directoryPath}`
            }
        }
    } catch (err) {
        console.error('Unable to scan directory: ' + err);
        return {
            success: false,
            err: err,
            msg: `Error processing scan directory: ${directoryPath}`
        }
    }
}

export async function deleteRowsBySource(sources: string[]) {
    try {
        await connectToMongo(["forUpload"]);
        const result = await GDriveItem.deleteMany({ source: { $in: sources } });
        console.log(`${result?.deletedCount} document(s) were deleted.`);
        printMongoTransactions(result);

    } catch (err) {
        printMongoTransactions(err.result, true);
        console.error('Error occurred while deleting documents: ', err);
    }
}
//deleteRowsBySource(['Treasures-60X', 'Treasures68XXX'] );

// gDriveExceltoMongo("C:\\_catalogWork\\_collation\\" +
//     "Treasures-1G6A8zbbiLHFlqgNnPosq1q6JbOoI2dI--07-Aug-2023-23-09_2674-Catalog-14-Apr-2024-09-52-2674.xlsx",
//     "Treasures-60"
// );

// "C:\\_catalogWork\\_collation\\_catCombinedExcels\\Treasures 60\\" + "Treasures 60-Catalog-24-Aug-2023-01-22-1694" + ".xlsx");
//process.exit(0);
// yarn run excelToMongoGDrive 
