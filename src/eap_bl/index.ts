import { excelToJson } from "../cliBased/excel/ExcelUtils";
import { EapBlExcepFormat } from "./types";
import { getArchiveMetadataForProfile } from "../archiveUpload/ArchiveProfileUtils";

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

export const findMetadataCorrespondingToTitle = (pdfName: string) => {
    const eapBlExcelAsJson: EapBlExcepFormat = getEapXLAsJson().find((eapBlExcel) => eapBlExcel["Digital Copies"] === pdfName);
    console.log(`eapBlExcelAsJson(${pdfName}) ${JSON.stringify(eapBlExcelAsJson)}`)
    return eapBlExcelAsJson;
}
/*
{
    "Identification": "File",
    "Titles": "Bhavishya",
    "__EMPTY_1": "भविष्य",
    "__EMPTY_2": "Bhavishya",
    "Scope andd Content": "Periodical",
    "__EMPTY_3": "Bhavishya magazine issue dated 2 Oct 1930. As a sign of protest, the editorial column has been left blank. In that blank space, a couplet on colonial draconian laws is pasted.",
    "__EMPTY_5": "1 issue containing 44 pages",
    "__EMPTY_6": "Height 35.2cm, width 24.5cm, depth 0.2cm",
    "__EMPTY_7": "Cover page torn, with upper left section missing. Yellowing pages, well preserved.",
    "Authority Terms": "British India",
    "__EMPTY_8": "India; Pakistan; Bangladesh",
    "__EMPTY_9": "Uttar Pradesh; United Provinces",
    "__EMPTY_10": "Allahabad; Prayagraj",
    "__EMPTY_12": "Politics and government|Literature|Poetry|Conflicts|Women|Marriage|Education|Portraits|Children|Publishing",
    "__EMPTY_13": "Untouchability, Unemployment",
    "Dates": "2 Oct 1930",
    "__EMPTY_18": "CSDS, Delhi, India",
    "__EMPTY_19": "Various Authors",
    "__EMPTY_21": "Printed and Published by Mr. Ram Rakh Singh Saigal, at the Fine Art Printing Cottage, 28 Edmonstone Road, Allahabad.",
    "__EMPTY_22": "Shri Ram Rakh Singh Saigal",
    "__EMPTY_23": "Year 1 Volume 1",
    "__EMPTY_24": "Issue 1; Number 1",
    "Languages": "Hindi|English",
    "__EMPTY_25": "Devanagari|Latin",
    "__EMPTY_26": "Left-to-Right",
    "Access conditions": "Unrestricted",
    "Copyright Information": "No",
    "Data Protection": "No",
    "Digital Copies": "EAP1435_Bhavishya_1930_Issue_1",
    "__EMPTY_34": "EAP1435_Bhavishya_1930_Issue_1_0001",
    "__EMPTY_35": "EAP1435_Bhavishya_1930_Issue_1_0044",
    "__EMPTY_36": 2023,
    "__EMPTY_37": ".tif",
    "__EMPTY_38": 44
    }
    */
   export const fetchDynamicMetadata = (pdfName: string) => {
       const eapBlExcelAsJson: EapBlExcepFormat = findMetadataCorrespondingToTitle(pdfName);
       console.log(`eapBlExcelAsJson(${pdfName}) ${JSON.stringify(eapBlExcelAsJson)}`)
       const _metadata = 
       `${eapBlExcelAsJson["__EMPTY_10"]}, ${eapBlExcelAsJson["__EMPTY_22"]},${eapBlExcelAsJson["__EMPTY_23"]},${eapBlExcelAsJson["__EMPTY_24"]},`;
       console.log(`_metadata ${_metadata}`)
       return _metadata
    }
    
    export const combineStaticAndDynamicMetadata = (_pdfName,profileName: string) => {
        const staticMetadata = getArchiveMetadataForProfile(profileName);
        const dynamicMetadata = fetchDynamicMetadata(_pdfName);
        console.log(`metadata ${staticMetadata.description},${dynamicMetadata}`)
    }
    const _pdfName = "EAP1435_Bhavishya_1930_Issue_1"
    const PROFILE="SR-BH"
    combineStaticAndDynamicMetadata(_pdfName,PROFILE)
    /*
    Convert a Endangered Archives Programme (EAP) Excel sheet to JSON
    */
   
   