import { excelToJsonFor2RowAsHeader, jsonToExcel } from "../cliBased/excel/ExcelUtils";
import { EAPBlExcelFormatForSecondRow } from "./types";
import { getArchiveMetadataForProfile, getFolderInSrcRootForProfile } from "../archiveUpload/ArchiveProfileUtils";
import * as FileUtils from "../utils/FileStatsUtils";
import { FileStats } from "imgToPdf/utils/types";
import os from "os";
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';

const eapBlExcelPath = "D:\\EAP1435_Metadata_CSDS.xlsm";
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

    const _descMetadata =
        `Description: ${eapBlExcelAsJson["Description"] || "None Specified"}
    Number and Type of Original Material : ${eapBlExcelAsJson["Number and Type of Original Material"] || "None Specified"}
    Related Subjects: '${eapBlExcelAsJson["Related Subjects\u000d\n"] || "None Specified"}'
    Other Related Subjects: '${eapBlExcelAsJson["Other Related Subjects"] || "None Specified"}'
    Dates of Material (Gregorian Calendar) : ${eapBlExcelAsJson["Dates of Material (Gregorian Calendar)"] || "None Specified"}
    Editor(s) of the Original Material: ${eapBlExcelAsJson["Editor(s) of the Original Material"] || "None Specified"}
    Volume Number:  ${eapBlExcelAsJson["Volume Number"] || "None Specified"}
    Issue Number: ${eapBlExcelAsJson["Issue Number"] || "None Specified"}`

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
        combinedDescMetadata: `Subjects: ${staticMetadata.description},${dynamicMetadata.subjectMetadata}\n${dynamicMetadata._descMetadata}`
    }
}

export const generateEAPBLMetadataForProfile = async (profileName: string, excelOutputName = "") => {
    const creator = getArchiveMetadataForProfile(profileName)?.creator;
    let directoryPath = getFolderInSrcRootForProfile(profileName);

    if (!profileName || !creator || !directoryPath) {
        console.log(`Invalid profileName(${profileName}) or creator(${creator}) or directoryPath(${directoryPath})`)
        return {
            "success": false,
            "msg": `Invalid profileName(${profileName}) or creator(${creator}) or directoryPath(${directoryPath})`
        };
    }

    //directoryPath
    // Check if the vanitize subfolder exists
    const vanitizePath = `${directoryPath}//_vanitized`;
    try {
        await fsPromise.access(vanitizePath, fs.constants.F_OK);
        console.log(`Subfolder 'vanitize' exists in ${directoryPath}`);
        directoryPath = vanitizePath;
    } catch (err) {
        console.log(`Subfolder 'vanitize' does not exist in ${directoryPath}`);
    }

    const fileStats = await FileUtils.getAllFileListingWithoutStats({ directoryPath: directoryPath })
    const excelV1Metadata = []
    fileStats.forEach((fileStat: FileStats) => {
        console.log(`fileStat ${fileStat.absPath}`)
        const _pdfName = fileStat.fileName.replace(".pdf", "")
        try{
            const _res = combineStaticAndDynamicMetadata(_pdfName, profileName)
            console.log(`combinedSubjecctMetadata: ${JSON.stringify(_res.combinedSubjectMetadata)}`);
            console.log(`combinedDescMetadata: ${JSON.stringify(_res.combinedDescMetadata)}`);
            excelV1Metadata.push({
                absPath: fileStat.absPath,
                subject: _res.combinedSubjectMetadata,
                description: _res.combinedDescMetadata,
                creator: creator
            })
        }
        catch (err) {
            console.log(`Error in processing ${_pdfName} ${err}`)
        }   
    })
    if (!excelOutputName || excelOutputName.trim().length === 0) {
        excelOutputName = "excelV1Metadata-Aug"
    }
    const homeDirectory = os.homedir();

    const _excelPath = `${homeDirectory}\\Downloads\\${excelOutputName}.xlsx`
    jsonToExcel(excelV1Metadata, _excelPath)
    return {
        "success": true,
        "msg": `Metadata generated successfully at ${_excelPath}`,
        "excelOutputName": _excelPath
    };
}

(async () => {
    // generateEAPBLMEtadataForProfile("SR-BH", "excelV1Metadatav1")
})();
/*
pnpm run convertEAPExcel
Convert a Endangered Archives Programme (EAP) Excel sheet to JSON
*/

