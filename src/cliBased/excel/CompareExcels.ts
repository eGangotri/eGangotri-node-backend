import { GDriveExcelHeaders, LocalFileHeaders } from "../googleapi/types";
import { LOCAL_FILE_NAME_HEADER, titleInGoogleDrive } from "../googleapi/_utils/constants";
import { excelToJson } from "./ExcelUtils";
import * as _ from 'lodash';
import * as fsPromise from 'fs/promises';


let noMatch: string[] = []
let match: string[] = []
let duplicates: string[] = []

const reset = () => {
    noMatch = []
    match = []
    duplicates = []
}

const findCommonDriveToLocal = (tileToCheck: string, localExcelAsJsonArray: LocalFileHeaders[]) => {
    const _found = localExcelAsJsonArray.filter(item => item[LOCAL_FILE_NAME_HEADER]?.trim() === tileToCheck?.trim())
    insertMatchData(_found, tileToCheck)
}

const findCommonLocalToDrive = (tileToCheck: string, googleDriveExcelAsJsonArray: GDriveExcelHeaders[]) => {
    const _found = googleDriveExcelAsJsonArray.filter(item => item[titleInGoogleDrive]?.trim() === tileToCheck?.trim())
    insertMatchData(_found, tileToCheck)
}

const findCommonLocalToLocal = (tileToCheck: string, jsonArray: LocalFileHeaders[]) => {
    const _found = jsonArray.filter(item => item[LOCAL_FILE_NAME_HEADER]?.trim() === tileToCheck?.trim())
    insertMatchData(_found, tileToCheck)
}

const removeLast5Chars = (str: string) => {
    return  str?.trim().slice(0, -9) + ".pdf";
}

const findCommonLocalToLocalReduced = (localTitle: string, localReducedArray: LocalFileHeaders[]) => {
    const _found = localReducedArray.filter(item => removeLast5Chars(item[LOCAL_FILE_NAME_HEADER]) === localTitle?.trim())
    insertMatchData(_found, localTitle)
}

const findCommonLocalReducedToLocal = (localReducedTitle: string, localArray: LocalFileHeaders[]) => {
    const _found = localArray.filter(item => item[LOCAL_FILE_NAME_HEADER]?.trim() === removeLast5Chars(localReducedTitle))
    insertMatchData(_found, localReducedTitle)
}

const insertMatchData = (_found: any[], tileToCheck: string) => {
    if (_.isEmpty(_found)) {
        noMatch.push(tileToCheck )
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
    localExcelAsJsonArray.map(x => findCommonLocalToDrive(x[LOCAL_FILE_NAME_HEADER], googleDriveExcelAsJsonArray));
}

const compareDriveToLocal = (googleDriveExcelAsJsonArray: GDriveExcelHeaders[], localExcelAsJsonArray: any[]) => {
    matchDriveToLocal(googleDriveExcelAsJsonArray, localExcelAsJsonArray)
    report();
    reset();
    matchLocalToDrive(localExcelAsJsonArray, googleDriveExcelAsJsonArray)
    report();

}

const compareLocal = (leftJsonArray: LocalFileHeaders[], rightJsonArray: LocalFileHeaders[]) => {
    leftJsonArray.map(x => findCommonLocalToLocal(x[LOCAL_FILE_NAME_HEADER], rightJsonArray));
    report();
    reset();
    rightJsonArray.map(x => findCommonLocalToLocal(x[LOCAL_FILE_NAME_HEADER], leftJsonArray));
    report();
}

const compareLocalToReduced = (localArray: LocalFileHeaders[], localReducedArray: LocalFileHeaders[]) => {
    localArray.map(x => findCommonLocalToLocalReduced(x[LOCAL_FILE_NAME_HEADER], localReducedArray));
    report();
    reset();
    localReducedArray.map(x => findCommonLocalReducedToLocal(x[LOCAL_FILE_NAME_HEADER], localArray));
    report();
}

//pnpm run compareExcels