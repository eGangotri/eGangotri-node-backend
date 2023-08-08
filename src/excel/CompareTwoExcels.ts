import { titleInGoogleDrive } from "../googleapi/_utils/constants";
import { excelToJson } from "./ExcelUtils";
import * as fs from 'fs';
import * as _ from 'lodash';


const noMatch: string[] = []
const match: string[] = []
const duplicates: string[] = []
const fileNameHeader = " File Name" //yes with a initial space
const findCommon = (tileToCheck: string, localExcelAsJsonArray: any[]) => {
    const _found = localExcelAsJsonArray.filter(item => item[fileNameHeader]?.trim() === tileToCheck?.trim())

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

const compare = () => {
    const googleDriveExcelPath = "C:\\_catalogWork\\_collation\\_googleDriveExcels\\Treasures 49";
    const localExcelPath = "C:\\_catalogWork\\_collation\\local\\Treasures49";

    const googleDriveExcel = `${googleDriveExcelPath}\\${fs.readdirSync(googleDriveExcelPath).find(x => x.includes(".xlsx"))}`;
    const localExcel = `${localExcelPath}\\${fs.readdirSync(localExcelPath).find(x => x.includes(".xlsx"))}`;

    console.log(googleDriveExcel)
    console.log(localExcel)
    const googleDriveExcelAsJsonArray = excelToJson(googleDriveExcel)
    const localExcelAsJsonArray = excelToJson(localExcel)

    googleDriveExcelAsJsonArray.map(x => findCommon(x[titleInGoogleDrive], localExcelAsJsonArray));

    for (let i = 0; i < noMatch.length; i++) {
        console.log(`noMatch ${noMatch[i]}`)
    }
    console.log(`googleDriveExcelAsJsonArray ${googleDriveExcelAsJsonArray.length}`)
    console.log(`localExcelAsJsonArray ${localExcelAsJsonArray.length}`)
    console.log(`match ${match.length}`)
    console.log(`noMatch ${noMatch.length}`)
    console.log(`duplicates ${duplicates.length}`)
}
compare()
//yarn run compareExcels