import { excelToJson } from "../excel/ExcelUtils";
import * as fs from 'fs';
import * as _ from 'lodash';
import { ExcelHeaders } from "../../cliBased/googleapi/types";
import { titleInGoogleDrive } from "../../cliBased/googleapi/_utils/constants";

//https://blog.archive.org/developers/

const _archiveQuery = (_query: string) => {
    return `https://archive.org/advancedsearch.php?q=${_query}&fl%5B%5D=identifier&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=50&page=1&output=json&callback=callback&save=yes#raw`;
}

const _archiveUrl = (_query: string) => {
    return `https://archive.org/details/${_query}`;
}

const searchArchive = async (leftExcel: string) => {
    const excelAsJson: ExcelHeaders[] = excelToJson(leftExcel)

    for (const entry of excelAsJson) {
        const _title = entry[titleInGoogleDrive];
        const query = _archiveQuery(_title)
        // const query = "https://www.google.com"
        console.log(`entry: ${_title} query\n ${query}`);
        const response: Response = await fetch(`${query}`)
        console.log(`response ${response.status}`)
        if (response.ok) {
            const _resp = await response.text();
            console.log(`response  ${_resp}`)
            const _jsonAsString = doReplacements(_resp)
            const jsonResp = JSON.parse(_jsonAsString)["response"]
            const numFound = jsonResp["numFound"]
            console.log(`response  ${_resp} ${numFound}`)

            if (numFound != 0) {
                const _docs = jsonResp["docs"][0]["identifier"]
                console.log(`_docs  ${_docs}`)
                console.log(`_archiveUrl  ${JSON.stringify(_archiveUrl(_docs))}`)
            }
        }
        break;
    }
}
const ARCHIVE_TEXT_RESPONSE_BEGINNING = "callback(";
function doReplacements(input: string): string {
    if (input?.length > 0 && input.startsWith(ARCHIVE_TEXT_RESPONSE_BEGINNING)) {
        input = input.replace(ARCHIVE_TEXT_RESPONSE_BEGINNING, "")
        const terminalChar = input[input.length - 1];
        if (terminalChar === ")") {
            return input.slice(0, input.length - 1)
        }
    }
    return input;
}
const _excelPath = "C:\\_catalogWork\\_collation\\_googleDriveExcels\\Treasures";

const leftExcel = `${_excelPath}\\${fs.readdirSync(_excelPath).find(x => x.includes(".xlsx"))}`;

console.log(`leftExcel ${leftExcel}`)

searchArchive(leftExcel);
//pnpm run searchArchive