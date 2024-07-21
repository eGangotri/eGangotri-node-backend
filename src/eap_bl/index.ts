import { excelToJsonFor2RowAsHeader } from "../cliBased/excel/ExcelUtils";
import { EAPBlExcelFormatForSecondRow } from "./types";
import { getArchiveMetadataForProfile } from "../archiveUpload/ArchiveProfileUtils";
import * as FileUtils from "../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";

const eapBlExcelPath = "D:\\EAP1435_Metadata_CSDS-X.xlsm";
const EAP_EXCEL_AS_JSON_ARRAY = []

export const getEapXLAsJson = () => {
    if (EAP_EXCEL_AS_JSON_ARRAY.length === 0) {
        convertEAPExcel(eapBlExcelPath);
    }
    return EAP_EXCEL_AS_JSON_ARRAY;
}

export const convertEAPExcel = (eapBlExcelPath: string) => {
    const eapBlExcelAsJson: EAPBlExcelFormatForSecondRow[] = excelToJsonFor2RowAsHeader(eapBlExcelPath, "2. Description");
    EAP_EXCEL_AS_JSON_ARRAY.push(...eapBlExcelAsJson);
    //console.log(`eapBlExcelAsJson ${JSON.stringify(EAP_EXCEL_AS_JSON_ARRAY[0])}`)
    //console.log(`eapBlExcel[7] ${JSON.stringify(EAP_EXCEL_AS_JSON_ARRAY[7])}`)
}

export const findMetadataCorrespondingToTitle = (pdfName: string) => {
    const eapBlExcelAsJson: EAPBlExcelFormatForSecondRow = getEapXLAsJson().find((eapBlExcel) => eapBlExcel["Digital Folder Name"] === pdfName);
    console.log(`eapBlExcelAsJson(${pdfName}) ${JSON.stringify(eapBlExcelAsJson)}`)
    return eapBlExcelAsJson;
}

export const fetchDynamicMetadata = (pdfName: string) => {
    const eapBlExcelAsJson: EAPBlExcelFormatForSecondRow = findMetadataCorrespondingToTitle(pdfName);
    console.log(`eapBlExcelAsJson(${pdfName}) ${JSON.stringify(eapBlExcelAsJson)}`)
    const _metadata = `${eapBlExcelAsJson["Title (In English)"]}, ${eapBlExcelAsJson["Title (In Original Language/Script)"]}, ${eapBlExcelAsJson["Content Type"]} `

    const _descMetadata = `
    Description: ${eapBlExcelAsJson["Description"] || ""}
    Number and Type of Original Material : ${eapBlExcelAsJson["Number and Type of Original Material"] || ""}
    Related Subjects: '${eapBlExcelAsJson["Related Subjects\u000d\n"] || ""}'
    Other Related Subjects: '${eapBlExcelAsJson["Other Related Subjects"] || ""}'
    Dates of Material (Gregorian Calendar) : ${eapBlExcelAsJson["Dates of Material (Gregorian Calendar)"] || ""}
    Editor(s) of the Original Material: ${eapBlExcelAsJson["Editor(s) of the Original Material"] || ""}
    Volume Number:  ${eapBlExcelAsJson["Volume Number"] || ""}
    Issue Number: ${eapBlExcelAsJson["Issue Number"] || ""}
`
    console.log(`_metadata ${_metadata}`)
    return {
        subjectMetadata: _metadata,
        _descMetadata
    }
}

export const combineStaticAndDynamicMetadata = (_pdfName, profileName: string) => {
    const staticMetadata = getArchiveMetadataForProfile(profileName);
    const dynamicMetadata = fetchDynamicMetadata(_pdfName);
    return {
        combinedSubjectMetadata: `${staticMetadata.description}, ${dynamicMetadata.subjectMetadata}`,
        combinedDescMetadata: `${staticMetadata.description}, ${dynamicMetadata.subjectMetadata},${dynamicMetadata._descMetadata}`
    }
}

(async () => {
    const PROFILE = "SR-BH"

    const directoryPath = "D:\\CSDS-Sarai-EAP-1435-Scans\\EAP 1435_Bhavishya_1930 to_1931 PDF Files";
    const fileStats = await FileUtils.getAllFileListingWithoutStats({ directoryPath: directoryPath })
    const 
    fileStats.forEach((fileStat:FileStats) => {
        console.log(`fileStat ${fileStat.absPath}`)
        const _pdfName = fileStat.fileName.replace(".pdf", "")
        const _res = combineStaticAndDynamicMetadata(_pdfName, PROFILE)
        console.log(`combinedSubjecctMetadata: ${JSON.stringify(_res.combinedSubjectMetadata)}`);
        console.log(`combinedDescMetadata: ${JSON.stringify(_res.combinedDescMetadata)}`);
    })
   


})();


/*
Convert a Endangered Archives Programme (EAP) Excel sheet to JSON
*/

