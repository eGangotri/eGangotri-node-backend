import { FILE_SIZE, LOCAL_FILE_NAME_HEADER, TOTAL_FILE_SIZE_IN_KB } from "../googleapi/_utils/constants";
import { LocalFileHeaders } from "../googleapi/types";
import { excelToJson } from "./ExcelUtils";
import * as fs from 'fs';
import * as _ from 'lodash';


const nonLatin = (jsonArray: LocalFileHeaders) => {
    const nonLatinCharacters = jsonArray[LOCAL_FILE_NAME_HEADER]?.toString().match(/[^\x00-\x7F]+/g);
    if (nonLatinCharacters) {
        console.log("Found non-Latin characters:", nonLatinCharacters.join(' '), jsonArray[FILE_SIZE]);
    }
    return nonLatinCharacters
}

const leftExcelPath = "C:\\_catalogWork\\_collation\\local\\Treasures23"
const leftExcel = `${leftExcelPath}\\${fs.readdirSync(leftExcelPath).find(x => x.includes(".xlsx"))}`;

console.log(leftExcel)

const leftJsonArray = excelToJson(leftExcel)
console.log(`leftJsonArray ${leftJsonArray.length}`)
leftJsonArray.filter(x => nonLatin(x as LocalFileHeaders));

//yarn run findNonLatin