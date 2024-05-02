import moment from "moment";
import { excelToJson, excelToJsonV2, jsonToExcel } from "../../cliBased/excel/ExcelUtils";
import { DD_MM_YYYY_HH_MMFORMAT } from "../../utils/constants";
import { FipExcelOne, FipExcelTwo } from "./utils";
import { ArchiveUploadExcelProps } from "archiveDotOrg/archive.types";

const base = "D:\\FIP\\_IFP\\_IFP"
/**
 * 1	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE00999.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE00999.pdf	.pdf
2	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE01000.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE01000.pdf	.pdf
3	D:\FIP\_IFP Palmleaf Manuscripts PDF All\RE03089.pdf	D:\FIP\_IFP Palmleaf Manuscripts PDF All	RE03089.pdf	.pdf

 */
const excelFirst = `${base}\\_IFP Palmleaf Manuscripts PDF All_MegaList_pdfs_only-01-May-2024-20-52.xlsx`;
const excelSecond = `${base}\\IFP Handlist Unicode-sanitized - FIP EFEO Pondicherry.xlsx`

// RE03175	Palm-leaf	Manuscript hand list – 1 2	Iraniya natakam	Tamil-lit.	Tamil
// RE03176	Palm-leaf	Manuscript hand list – 1 2	Rattinach churukkam	Tamil-lit.	Tamil
// RE03177	Palm-leaf	Manuscript hand list – 1 2	Vaittiya nul	Vaidya	Tamil

const mainExcelData: FipExcelOne[] = excelToJson(excelFirst);
const secondaryExcelData: FipExcelTwo[] = excelToJsonV2<FipExcelTwo>(excelSecond);
console.log(`mainExcelData ${JSON.stringify(mainExcelData[0])}`)
console.log(`mainExcelData ${JSON.stringify(secondaryExcelData[0])}`)

const findCorrespondingExcelHeader = (firstExcel: FipExcelOne, secondExcel: FipExcelTwo[]) => {
    let firstExcelFileName = firstExcel.fileName

    const matchingItem = secondExcel?.find((secondExcel: FipExcelTwo) => {
        return firstExcelFileName?.match(secondExcel.identifier)
    })
    if (firstExcelFileName === "RE10666.pdf" || firstExcelFileName === "RE00999.pdf") {
        console.log(`firstExcelFileName ${firstExcelFileName} 
        secondExcel ${JSON.stringify(matchingItem)}`)
    }
    if (matchingItem) {
        combinedExcel.push({
            absPath: firstExcel.absPath,
            subject: `${matchingItem?.handlist || ""}, ${matchingItem?.material|| ""}, ${matchingItem?.script|| ""} ${matchingItem?.subject || ""}, FIP-EFEO-Pondicherry`,
            description: `${matchingItem?.title|| ""} ${firstExcel?.fileName|| ""} ${matchingItem?.handlist|| ""}, ${matchingItem?.material || ""}, ${matchingItem?.script || ""} ${matchingItem?.subject || ""}, FIP-EFEO`,
            creator: "FIP-EFEO-Pondicherry",
            title:matchingItem?.title
        });
    }
}

let combinedExcel: ArchiveUploadExcelProps[] = []
mainExcelData.forEach(x => findCorrespondingExcelHeader(x, secondaryExcelData));
const timeComponent = moment(new Date()).format(DD_MM_YYYY_HH_MMFORMAT)

console.log(`Combining JSON Data: ${JSON.stringify(combinedExcel.splice(0, 1))}`)
jsonToExcel(combinedExcel, `${base}//fip-uploadables-${timeComponent}.xlsx`)

//yarn run combineFIPExcels