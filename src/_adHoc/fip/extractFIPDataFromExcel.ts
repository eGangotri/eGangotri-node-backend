import { readFile, utils } from 'xlsx';
import { aksharamukhaIastToRomanColloquial } from '../../aksharamukha/convert';
import * as _ from 'lodash';
import { jsonToExcel } from '../../cliBased/excel/ExcelUtils';

const transformExcelToJSON = async (pathToExcel: string) => {
    console.log(`transformExcelToJSON ${pathToExcel}`);
    // Read the Excel file
    const workbook = readFile(pathToExcel);
    const sheetNameList = workbook.SheetNames;
    const data = utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const nonEmptyData = data?.filter((x: FIPJSonTypes) => x?.serialNo != undefined && x?.serialNo != "");
    const newData = await sanitizeJson(nonEmptyData);
    console.log(`(${data?.length})NonEmpty[${nonEmptyData.length}] = ${newData?.length}`);
    console.log(`transformExcelToJSON  items  ${JSON.stringify(newData[0])}`);
    const _pathToGeneratedExcel = pathToExcel.replace(".xlsx", "-sanitized-2.xlsx");
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
        if (row?.identifier === "RENumber" || row?.identifier === "") {
            continue
        }
        if (row?.identifier?.startsWith("RE")) {
            const identifier = row["identifier"]?.split(/\s/).join("");
            newRow.identifier = identifier
            
        if (row?.material) {
            newRow.material = row.material.trim()?.replace(/\"/g, "")
        }
        newRow.handlist = manuscriptHandListNum;
        const conversionString = `${row?.title?.replace(/\"/g, "")}  $ ${row?.subject?.replace(/\"/g, "")} $ ${row?.script}`

        // const colloquialRomanized = "a$b$c";
        const colloquialRomanized = await aksharamukhaIastToRomanColloquial(conversionString);

        const [title, subject, script] = colloquialRomanized.split("$");
        newRow.title = _.capitalize(title?.trim().replace(/\"/g, "") || "") ;
        newRow.subject = _.capitalize(subject?.trim().replace(/\"/g, "")|| "");
        newRow.script = _.capitalize(script?.trim().replace(/\"/g, "")|| "");

        sanitizedData.push(newRow);
        }

    }
    return sanitizedData
}

//pnpm run extractFIPDataFromExcel 
transformExcelToJSON("D:\\FIP\\_IFP\\_IFP\\IFP Handlist Unicode.xlsx");