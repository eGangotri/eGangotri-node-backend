import exp from "constants";
import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { EapBlExcepFormat } from "./types";

const eapBlExcelPath = "D:\\CSDS-Sarai-EAP-1435-Scans\\EAP1435_Metadata_CSDS.xlsm";
const EAP_EXCEL_AS_JSON_ARRAY = []

export const getEapXLAsJson = () => {
    if (EAP_EXCEL_AS_JSON_ARRAY.length === 0) {
        convertEAPExcel(eapBlExcelPath);
    }
    return EAP_EXCEL_AS_JSON_ARRAY;
}
export const convertEAPExcel = (eapBlExcelPath: string) => {
    const eapBlExcelAsJson: EapBlExcepFormat[] = excelToJson(eapBlExcelPath, "2. Description");
    EAP_EXCEL_AS_JSON_ARRAY.push(...eapBlExcelAsJson);
    console.log(`eapBlExcelAsJson ${JSON.stringify(EAP_EXCEL_AS_JSON_ARRAY[0])}`)
    console.log(`eapBlExcel[45] ${JSON.stringify(EAP_EXCEL_AS_JSON_ARRAY[3]["Digital Copies"])}`)
}

const _pdfName = "EAP1435_Bhavishya_1930_Issue_1"
export const getEAPExcelAsJson = (pdfName: string) => {
    const eapBlExcelAsJson: EapBlExcepFormat = getEapXLAsJson().find((eapBlExcel) => eapBlExcel["Digital Copies"] === pdfName);
    console.log(`eapBlExcelAsJson(${pdfName}) ${JSON.stringify(eapBlExcelAsJson)}`)
    return eapBlExcelAsJson;
}
/*
Convert a Endangered Archives Programme (EAP) Excel sheet to JSON
*/

getEAPExcelAsJson(_pdfName);