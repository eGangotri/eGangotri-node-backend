import { readFile, utils } from 'xlsx';
import { connectToMongo } from '../../services/dbService';
import { printMongoTransactions } from '../../excelToMongo/utils';
import { GDriveItem } from '../../models/GDriveItem';
import path from 'path';
import { getLatestExcelFile } from '../../utils/utils';
import { aksharamukhaIastToRomanColloquial } from '../../aksharamukha/convert';
import * as _ from 'lodash';
import { jsonToExcel } from '../../cliBased/excel/ExcelUtils';

const transformExcelToJSON = async (pathToExcel: string) => {
    console.log(`transformExcelToJSON ${pathToExcel}`);
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const nonEmptyData = data.filter((x: FIPJSonTypes) => x?.title?.trim().length > 0);
    const newData = await sanitizeJson(data);
    console.log(`(${data?.length})NonEmpty[${nonEmptyData.length}] = ${newData?.length}`);
    console.log(`transformExcelToJSON  items  ${JSON.stringify(newData[0])}`);
    const _pathToGeneratedExcel = pathToExcel.replace(".xlsx", "-sanitized.xlsx");
    jsonToExcel(newData, _pathToGeneratedExcel)
    console.log(`Dumping Data to New Excel: ${_pathToGeneratedExcel}`);
    return newData;
}

interface FIPJSonTypes {
    serialNo?: string;
    title?: string;
    identifier?: string;
    subject?: string;
    script?: string;
    material?: string;
    handlist?: string;
}
async function sanitizeJson(data: FIPJSonTypes[]) {
    const sanitizedData = [];
    let manuscriptHandListNum = ""
    let counter = 0;

    for (const row of data) {
        counter++;
        console.log(`counter ${counter}`)
        if (counter > 5) {
            //break;
        }
        const newRow: FIPJSonTypes = {};
        if (row?.serialNo?.toString()?.includes("Manuscript Hand")) {
            manuscriptHandListNum = _.capitalize(row?.serialNo?.trim());
            continue
        }
        if (row?.identifier === "RENumber") {
            continue
        }
        if (row?.identifier?.startsWith("RE")) {
            const identifier = row["identifier"]?.split(/\s/).join("");
            newRow.identifier = identifier
        }

        if (row?.material) {
            newRow.material = row.material.trim()
        }
        newRow.handlist = manuscriptHandListNum;
        const conversionString = `${row?.title?.replace(/\"/g, "")}  $ ${row?.subject?.replace(/\"/g, "")} $ ${row?.script}`

        // const colloquialRomanized = "a$b$c";
        const colloquialRomanized = await aksharamukhaIastToRomanColloquial(conversionString);

        const [title, subject, script] = colloquialRomanized.split("$");
        newRow.title = _.capitalize(title?.trim())
        newRow.subject = _.capitalize(subject?.trim());
        newRow.script = _.capitalize(script?.trim());

        sanitizedData.push(newRow);
    }
    return sanitizedData
}
async function excelJsonToMongo(newData: {}[]) {
    const operations = newData.map((document, index) => {
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
            const newData = await transformExcelToJSON(gDriveExcel)
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
//yarn run fipExcelToMongo 
transformExcelToJSON("C:\\Users\\chetan\\Downloads\\_IFP\\IFP Handlist Unicode.xlsx");