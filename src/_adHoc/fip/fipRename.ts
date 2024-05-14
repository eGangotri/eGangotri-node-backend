//fip-uploadables-01-May-2024-17-56
import moment from "moment";
import { excelToJson, jsonToExcel } from "../../cliBased/excel/ExcelUtils";
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/constants";
import * as fs from "fs";
import { FipExcelOne } from "./utils";

const base = "D:\\FIP\\_IFP\\_IFP"
/**
 * 1	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE00999.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE00999.pdf	.pdf
2	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE01000.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE01000.pdf	.pdf
3	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE03089.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE03089.pdf	.pdf

 */
const excelFirst = `${base}\\fip-uploadables-01-May-2024-17-56.xlsx`;
let counter = 0;
let failureCount = 0
const _rename = (item: FipExcelOne) => {
    console.log(`item ${JSON.stringify(item)}`)
    console.log(item.absPath)
    console.log(item.title)
    if (item.title) {
        counter++
        const splitFilename = item.absPath.split("-")
        const _newFileNam = `${splitFilename[0]} ${(item.title.length <= 120) ? item.title : item.title.substring(0, 120)} - ${splitFilename[1]}`
        console.log(`_newFileNam ${_newFileNam}`)
        if (fs.existsSync(_newFileNam)) {
            console.log(`File exists ${item.absPath}. renaming to ${item.absPath}_ignore`);
        }
        else if (fs.existsSync(item.absPath)) {
            try {
                fs.renameSync(item.absPath, _newFileNam);
                console.log(`File renamed to ${_newFileNam}`)
            }
            catch (e) {
                failureCount++
                console.log(`Error renaming file ${item.absPath} to ${_newFileNam} ${e} ${failureCount}`)
            }
        }
        item.absPath = _newFileNam

    }
}

let combinedExcel: FipExcelOne[] = excelToJson(excelFirst);

combinedExcel.forEach(x => _rename(x));
const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

console.log(`Combining JSON Data: ${JSON.stringify(combinedExcel.splice(0, 1))}`)
jsonToExcel(combinedExcel, `${base}//fip-uploadables-${timeComponent}-(${counter})(${combinedExcel.length}).xlsx`)

//yarn run fipRename