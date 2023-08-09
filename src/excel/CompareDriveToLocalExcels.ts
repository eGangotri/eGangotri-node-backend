import { titleInGoogleDrive } from "../googleapi/_utils/constants";
import { ExcelHeaders } from "../googleapi/types";
import { excelToJson } from "./ExcelUtils";
import * as fs from 'fs';
import * as _ from 'lodash';


let noMatch: string[] = []
let match: string[] = []
let duplicates: string[] = []

const reset = () => {
    noMatch = []
    match = []
    duplicates = []
}

const fileNameHeader = "File Name" //yes with a initial space
const findCommonDriveToLocal = (tileToCheck: string, localExcelAsJsonArray: any[]) => {
    const _found = localExcelAsJsonArray.filter(item => item[fileNameHeader]?.trim() === tileToCheck?.trim())
    insertMatchData(_found, tileToCheck)
}

const findCommonLocalToDrive = (tileToCheck: string, googleDriveExcelAsJsonArray: ExcelHeaders[]) => {
    const _found = googleDriveExcelAsJsonArray.filter(item => item[titleInGoogleDrive]?.trim() === tileToCheck?.trim())
    insertMatchData(_found, tileToCheck)
}

const insertMatchData = (_found: any[], tileToCheck: string) => {
    if (_.isEmpty(_found)) {
        noMatch.push(tileToCheck)
    }
    if (!_.isEmpty(_found)) {
        match.push(tileToCheck)

        if (_found.length > 1) {
            duplicates.push(tileToCheck)
        }
    }
}
const report = () => {
    for (let i = 0; i < noMatch.length; i++) {
        console.log(`noMatch ${noMatch[i]}`)
    }
    for (let i = 0; i < duplicates.length; i++) {
        console.log(`duplicates ${duplicates[i]}`)
    }
    console.log(`match ${match.length}`)
    console.log(`noMatch ${noMatch.length}`)
    console.log(`duplicates ${duplicates.length}`)
    console.log(`------------------------`)
}


const matchDriveToLocal = (googleDriveExcelAsJsonArray: any[], localExcelAsJsonArray: any[]) => {
    googleDriveExcelAsJsonArray.map(x => findCommonDriveToLocal(x[titleInGoogleDrive], localExcelAsJsonArray));
}

const matchLocalToDrive = (localExcelAsJsonArray: any[], googleDriveExcelAsJsonArray: any[]) => {
    localExcelAsJsonArray.map(x => findCommonLocalToDrive(x[fileNameHeader], googleDriveExcelAsJsonArray));
}

const compare = () => {
    const googleDriveExcelPath = "C:\\_catalogWork\\_collation\\_googleDriveExcels\\Treasures 32";
    const localExcelPath = "C:\\_catalogWork\\_collation\\local\\Treasures32";

    const googleDriveExcel = `${googleDriveExcelPath}\\${fs.readdirSync(googleDriveExcelPath).find(x => x.includes(".xlsx"))}`;
    const localExcel = `${localExcelPath}\\${fs.readdirSync(localExcelPath).find(x => x.includes(".xlsx"))}`;

    console.log(googleDriveExcel)
    console.log(localExcel)
    const googleDriveExcelAsJsonArray = excelToJson(googleDriveExcel)
    const localExcelAsJsonArray = excelToJson(localExcel)


    console.log(`googleDriveExcelAsJsonArray ${googleDriveExcelAsJsonArray.length}`)
    console.log(`localExcelAsJsonArray ${localExcelAsJsonArray.length}`)

    matchDriveToLocal(googleDriveExcelAsJsonArray, localExcelAsJsonArray)
    report();
    reset();
    matchLocalToDrive(localExcelAsJsonArray, googleDriveExcelAsJsonArray)
    report();

}
compare()
//yarn run compareExcels